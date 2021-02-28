import json 
import os
import nltk
import ssl

try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

nltk.download()


def intensity(messages):
    # assuming messages with type='Generic' and are with textual content
    pos_scores = []
    neg_scores = []
    for m in messages:
        s = sia.polarity_scores(m)
        pos_scores.append(s['pos'])
        neg_scores.append(s['neg'])
    pos = np.mean(pos_scores)
    neg = np.mean(neg_scores)
    freq = len(messages)
    return pos, neg, freq

senti = []
for filename in sorted(os.listdir('msgs')):
    print(filename)
    if filename == '.DS_Store':
        continue
    with open("msgs/"+filename, "r") as df:
        data = json.load(df)
        person = data['participants'][0]['name']
        msgs = [d['content'] for d in data['messages'] if('content' in d) & (d['type']=='Generic')]
        pos, neg, freq = intensity(msgs)
    new_data = {"name":person, "pos":pos, "neg":neg, "freq":freq}
    senti.append(new_data)
with open('sentiments.json', 'w') as outfile:
    json.dump(senti, outfile)