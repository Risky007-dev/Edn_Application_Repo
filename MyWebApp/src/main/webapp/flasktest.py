from flask import Flask, render_template, send_from_directory

# Tell Flask where your HTML/CSS/JS live
WEBAPP_DIR = "src/main/webapp"

app = Flask(
    __name__,
    template_folder=WEBAPP_DIR,   # where index.html is
    static_folder=WEBAPP_DIR,     # serve css/js/img from same folder
    static_url_path=""            # so /file.png works
)

@app.get("/")
def home():
    # you can pass variables into the page if you like
    return render_template("index.html", launch_iso="2025-12-01T15:00:00Z")

# (Optional) catch-all to serve other files from webapp/
@app.get("/<path:path>")
def static_proxy(path):
    return send_from_directory(WEBAPP_DIR, path)

if __name__ == "__main__":
    # Use a port that doesn't clash with Tomcat (8080). 5000/5001 are common.
    app.run(host="0.0.0.0", port=5001, debug=True)
