from flask import Flask, render_template


# Create the Flask application.
app = Flask(__name__)


@app.route("/")
def home():
    """Show the SaveWise homepage."""
    return render_template("index.html")


if __name__ == "__main__":
    # Debug mode reloads the app when files change and shows helpful errors.
    app.run(debug=True)
