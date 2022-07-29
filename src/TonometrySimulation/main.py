# Start simple python server

PORT = 8000


def start_simple_server():
    # https://stackabuse.com/serving-files-with-pythons-simplehttpserver-module/
    import http.server
    import socketserver
    handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print("Server started at localhost:" + str(PORT))
        httpd.serve_forever()


# Press the green button in the gutter to run the script.
if __name__ == '__main__':
    start_simple_server()
