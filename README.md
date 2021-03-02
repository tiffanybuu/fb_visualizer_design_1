# Facebook Messenger Visualizer 

## Steps to run the repo:
#### 1. Download FB Messages
Download your messages from Facebook (Facebook Settings > Your Facebook Information > Download Your Information). Specifically, make sure you check "messages", but feel free to download whatever else you're interested in.
You'll get the data as a zip file. In it should be a `messages` folder. Move/copy the `inbox` folder from it into the directory with `data.py`. You can also merge the contents of `archived_threads` in as well if you'd like.

#### 2. Install
You'll need `pandas`, `numpy`, and `nltk`. You can install them through `pip` if you don't have them already.
You'll also need Node.
#### 3. Run
1. Run `python data.py `
If a prompt appears, click download to get the required NLTK data files. Once everything is installed (it should all be colored green), you can close the download window. The script will process your Facebook data.

2. Run `npm start` to view the visualization in the browser.

