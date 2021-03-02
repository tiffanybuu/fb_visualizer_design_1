import json
import os
import sys
import glob
import io
from datetime import datetime, date
from dateutil.parser import parse
from collections import defaultdict, OrderedDict

import pandas as pd

# we can change the dates if needed
date_begin = datetime(2019, 3, 1)
date_end = datetime(2021, 1, 31)
covid_start = datetime(2020, 3, 1)

def convert_time(messages):
    for message in messages:
        # https://docs.python.org/3/library/datetime.html#strftime-and-strptime-format-codes
        message['timestamp_ms'] = parse(datetime.fromtimestamp(float(message['timestamp_ms']) / 1000).strftime('%Y-%m-%d %H:%M:%S'))

        #decoding emojis
        if ('content' in message):
            message['content'] = message['content'].encode('raw_unicode_escape').decode('utf-8')

    # filtering to show all messages between march 2019 and end of jan 2021
    # double check this
    messages = [message for message in messages if
                    message['timestamp_ms'] >= date_begin and
                    message['timestamp_ms'] <= date_end
                    ]
    return messages

# encoding for debugging
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="UTF-8")
pd.set_option('display.max_columns', None)

messages = []

for filename in sorted(os.listdir('inbox')):
    json_file = glob.glob(os.path.join('inbox', filename, '*.json'))
    if json_file:
        # take into account messages with one person with split json files
        # appends all messages into one object
        if (len(json_file) > 1):
            new_messages = []
            for index in range(1, len(json_file)):
                with open(json_file[index], encoding='utf-8') as curr_json_file:
                    data = json.load(curr_json_file)
                    new_messages.append(data['messages'])

            with open(json_file[0], encoding='utf-8') as f:
                data = json.load(f)
                for mm in new_messages:
                    for m in mm:
                        data['messages'].append(m)
                messages.append(data)
        else:
            with open(json_file[0], encoding='utf-8') as curr_json_file:
                messages.append(json.load(curr_json_file))


with open('outfile.json', 'w') as outfile:
    json.dump(messages, outfile)


df = pd.read_json('outfile.json')
df_copy = df.copy()

# dropping rows containing group chats
df_copy = df_copy[df_copy['participants'].apply(lambda row: len(row) < 3)].reset_index(drop=True)

# converting ms time to datetime
df_copy['messages'] = df_copy['messages'].apply(lambda messages: convert_time(messages))
# dropping resulting empty rows
df_copy = df_copy[df_copy['messages'].str.len() > 0].reset_index(drop=True)


# DATA PARSING FOR FREQUENCY OF MESSAGES ----
freq_messages = defaultdict(lambda: defaultdict(int))

for index, row in df_copy.iterrows():
    participants = row['participants']
    friend = participants[0]['name']

    if (len(participants) == 2):
        user = participants[1]['name']
        for message in row['messages']:
            date = message['timestamp_ms']
            date_formatted = (datetime.strftime(date, '%b-%Y'))
            sender_name = message['sender_name']

            if sender_name == friend:
                # freq_messages[date_formatted] = defaultdict(int)
                freq_messages[date_formatted]['received'] += 1
            else:
                # freq_messages[date_formatted] = defaultdict(int)
                freq_messages[date_formatted]['sent'] += 1

freq_messages = dict(sorted(freq_messages.items(), key = lambda x: datetime.strptime(x[0], '%b-%Y')))

final = []

for key, value in freq_messages.items():
    dicts = {}
    if 'date' not in dicts:
        dicts['date'] = key
    if 'received' not in dicts:
        dicts['received'] = value['received']
    if 'sent' not in dicts:
        dicts['sent'] = value['sent']
    final.append(dicts)

with open("public/freq_messages.json", "w") as outfile:
    json.dump(final, outfile)


# DATA PARSING FOR CALL DURATION ----
call_duration_dict = defaultdict(lambda: defaultdict(int))

for index, row in df_copy.iterrows():
    participants = row['participants']
    friend = participants[0]['name']

    call_duration_dict[friend] = defaultdict(int)
    for message in row['messages']:
        type_of_call = message['type']
        date = message['timestamp_ms']

        if type_of_call == 'Call':
            call_duration_dict[friend]['total'] += message['call_duration']
            if date < covid_start:
                call_duration_dict[friend]['before_covid'] += message['call_duration']
            else:
                call_duration_dict[friend]['during_covid'] += message['call_duration']

call_duration_dict = dict(sorted(call_duration_dict.items(), key = lambda x: x[1]['total'], reverse=True)[:5])

final_call_duration_dict = []
for key, value in call_duration_dict.items():
    dicts = {}
    if 'friend' not in dicts:
        dicts['friend'] = key
    if 'total' not in dicts:
        dicts['total'] = value['total']/60.0
    if 'before_covid' not in dicts:
        dicts['before_covid'] = value['before_covid']/60.0
    if 'during_covid' not in dicts:
        dicts['during_covid'] = value['during_covid']/60.0
    final_call_duration_dict.append(dicts)

with open("public/call_duration.json", "w") as outfile:
    json.dump(final_call_duration_dict, outfile)


# NUMBER OF CALLS ---------------
freq_calls = defaultdict(int)

for index, row in df_copy.iterrows():
    for message in row['messages']:
        type_of_call = message['type']
        date = message['timestamp_ms']
        date_formatted = (datetime.strftime(date, '%b-%Y'))

        if type_of_call == 'Call':
            freq_calls[date_formatted] += 1


freq_calls = dict(sorted(freq_calls.items(), key = lambda x: datetime.strptime(x[0], '%b-%Y')))
final_calls = []

for key, value in freq_calls.items():
    dicts = {}
    if 'date' not in dicts:
        dicts['date'] = key
    if 'total' not in dicts:
        dicts['total'] = value

    final_calls.append(dicts)

with open("public/freq_calls.json", "w") as outfile:
    json.dump(final_calls, outfile)

# KEYWORD DATA ----------------
keywords = {}
keywords["covid"] = [["covid", "covid-19", "coronavirus"], "pandemic", "mask", "hospital", "case", "death", "vaccine", "quarantine", "lockdown", "social distancing", "6 feet"]
keywords["emotions"] = ["happy", "angry", "sad", "mad", ["depressed", "depressing"], ["stressed", "stressful"], \
 ["lonely", "alone"], ["relieved", "relief"], "glad", "scared", "fear", "anxious", "nervous", ["bored", "boring"], ["confused", "confusing"]]
keywords["work"] = ["homework", "presentation", "interview", "call", "essay", "paper", "mp", "assignment", "test", "quiz", "zoom", "job", "internship", \
 "course", "class", "grade", "promotion", "career", "student", "professor", "email"]
keywords["recreation"] = ["run", "read", "relax", "play", "swim", "jog", "spa", ["cycling", "bike", "bicycle"], "gym", ["lifting", "training"], ["hike", "hiking"], \
 ["dive", "diving"], "drink", ["dance", "dancing"], "learn", "sing", "guitar", "piano", "viola", "violin", "cello", ["bake", "baking"], ["cook", "cooking"]]

pre_covid_keyword_freqs = {
    "covid": {},
    "emotions": {},
    "work": {},
    "recreation": {}
}

covid_keyword_freqs = {
    "covid": {},
    "emotions": {},
    "work": {},
    "recreation": {}
}

for index, row in df_copy.iterrows():
    for message in row["messages"]:
        if "content" not in message:
            continue

        msg_content = message["content"].lower()
        dict_to_update = pre_covid_keyword_freqs if message["timestamp_ms"] < covid_start else covid_keyword_freqs

        for category in keywords:
            for word_group in keywords[category]:
                if isinstance(word_group, list):
                    for word in word_group:
                        wrapped_word = " " + word + " "
                        if wrapped_word in msg_content:
                            dict_to_update[category][word_group[0]] = dict_to_update[category].get(word_group[0], 0) + 1
                            break
                else:
                    wrapped_word = " " + word_group + " "
                    if wrapped_word in msg_content:
                        dict_to_update[category][word_group] = dict_to_update[category].get(word_group, 0) + 1

keyword_output = { "pre_covid" : [],
                   "during_covid" : []
}

#convert to a flatter representation of the data
for category in pre_covid_keyword_freqs:
    for word in pre_covid_keyword_freqs[category]:
        keyword_output["pre_covid"].append({ "word" : word, "freq" : pre_covid_keyword_freqs[category][word], "category" : category })

for category in covid_keyword_freqs:
    for word in covid_keyword_freqs[category]:
        keyword_output["during_covid"].append({ "word" : word, "freq" : covid_keyword_freqs[category][word], "category" : category })

with open("public/freq_keywords.json", "w") as outfile:
    json.dump(keyword_output, outfile)
