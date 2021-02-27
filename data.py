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
                data['messages'].append(new_messages[0][0])
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
freq_messages_sent = defaultdict(int)
freq_messages_received = defaultdict(int)


for index, row in df_copy.iterrows():
    participants = row['participants']
    friend = participants[0]['name']
    
    if (len(participants) == 2):
        user = participants[1]['name']
        for message in row['messages']:
            date = message['timestamp_ms']
            date_formatted = (datetime.strftime(date, '%B-%Y'))
            sender_name = message['sender_name']

            if sender_name == friend:
                freq_messages_received[date_formatted] += 1
            else:
                freq_messages_sent[date_formatted] += 1

freq_messages_sent = sorted(freq_messages_sent.items(), key = lambda x: datetime.strptime(x[0], '%B-%Y'))
freq_messages_received = sorted(freq_messages_received.items(), key = lambda x: datetime.strptime(x[0], '%B-%Y'))

with open("freq_messages_sent.json", "w") as outfile:
    json.dump(freq_messages_sent, outfile)

with open("freq_messages_received.json", "w") as outfile:
    json.dump(freq_messages_received, outfile)