# PDF to CBZ Converter
Offline PDF to CBZ (Comic Book Zip) converter, completely web based.

> [!NOTE]
> Make sure your cache is enabled. After you last load the page, you need to have converted at least one file online before going offline. This means loading → going offline → converting doesn't work; it has to be **loading → converting → JS files caching → going offline → converting again**. I don't know why.

Say you've always had this problem where you download a book and it is a long line of pages to scroll through. You may be able to split it up into two-page view in your normal PDF viewer, or you may not. Now, you can upload the book here and it works fine in your comic reader (e.g. Calibre)!

Fun fact, for those who don't have a comic reader: Did you know Proton Drive supports comic books on both desktop and mobile web? They did that when [someone asked for it](https://www.reddit.com/r/ProtonDrive/comments/1gvfr4q/comment/m0d15yv/).

## Running locally
```sh
git clone https://github.com/46009361/pdf-cbz.git
cd ~/pdf-cbz
```
Next steps are below.
### Python example (for localhost:8080)
```sh
python -m http.server 8080
```
### Node.js example (for localhost:3000)
```sh
npm install serve # if you haven't already
npm serve . -p 3000
```
