import nltk
import ssl

try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

nltk.download()
from nltk.sentiment import SentimentIntensityAnalyzer
sia = SentimentIntensityAnalyzer()

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
    return {"pos":pos, "neg":neg}
