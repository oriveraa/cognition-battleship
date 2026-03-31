from flask import Flask, render_template, request, jsonify
import webbrowser
import threading
import time

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/static/<path:filename>')
def static_files(filename):
    return app.send_static_file(filename)

def open_browser():
    """Open browser after a short delay to ensure server is running"""
    time.sleep(1.5)
    webbrowser.open('http://127.0.0.1:8080')

if __name__ == '__main__':
    print("Starting Battleship Web Game...")
    print("The game will open in your browser automatically.")
    print("If it doesn't open, navigate to: http://127.0.0.1:8080")
    print("Press Ctrl+C to stop the server.")
    
    # Start browser in a separate thread
    threading.Thread(target=open_browser, daemon=True).start()
    
    # Run the Flask app
    app.run(debug=True, host='127.0.0.1', port=8080, use_reloader=False)
