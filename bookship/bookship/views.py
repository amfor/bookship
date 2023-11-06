from django.shortcuts import render
from django.conf import settings
from django.views.generic.edit import FormView
from .forms import FileUploadForm
from .models import UploadedFile
import nbformat
from nbconvert import HTMLExporter
from nbformatting.review_exporter import MyExporter

# Create your views here.
def index(request):
    return render(request, 'bookship/index.html')

class FileUploadView(FormView):
    template_name = 'compare.html'
    form_class = FileUploadForm
    success_url = '/generated_html/'

    def form_valid(self, form):
        # Save the uploaded files
        form.save()

        # Call your Python command to generate the HTML
        # You can use subprocess or any method you prefer
        # Replace 'generate_html_command' with your actual command
        import subprocess
        subprocess.run(['nbdiff-web', form.instance.file1.path, form.instance.file2.path])

        return super().form_valid(form)

import jwt
import requests
import time
from django.http import HttpResponse
import base64
from .settings import GITHUB_PRIVATE_KEY


def github_integration(request):
    # Your GitHub App settings
    APP_ID = '398519'
    INSTALLATION_ID = '43170684'
    REPO_OWNER = 'amfor'
    REPO_NAME = 'nbdiff'
    FILE_PATH = 'src/mynotebook2.ipynb'

    # Create a JSON Web Token (JWT)
    payload = {
        'iat': int(time.time()),
        'exp': int(time.time()) + 60,
        'iss': APP_ID
    }
    jwt_token = jwt.encode(payload, GITHUB_PRIVATE_KEY, algorithm='RS256')

    # Use the JWT to get an access token
    headers = {
        'Authorization': f'Bearer {jwt_token}',
        'Accept': 'application/vnd.github.machine-man-preview+json'
    }
    access_token_response = requests.post(f'https://api.github.com/app/installations/{INSTALLATION_ID}/access_tokens', headers=headers)

    access_token = access_token_response.json().get('token')

    # Use the access token to access the file content
    file_content_response = requests.get(f'https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/contents/{FILE_PATH}', headers={'Authorization': f'Bearer {access_token}'})
    file_content = file_content_response.json().get('content')

    # Use the access token to access the file content
    if file_content_response.status_code == 200:
        file_content = file_content_response.json().get('content')
        
        if file_content:
            # Decode the base64-encoded content
            import base64
            decoded_content = base64.b64decode(file_content).decode('utf-8')

            # You can now use the 'decoded_content' in your Django app
            html_exporter = MyExporter(template_name='classic')
            notebook = nbformat.reads(decoded_content, as_version=4)
            (body, resources) = html_exporter.from_notebook_node(notebook)
            return HttpResponse(body)

        else:
            return HttpResponse("File content is empty or not found")
    else:
        return HttpResponse(f"Failed to fetch file content. Status code: {file_content_response.status_code}")

    return HttpResponse(decoded_content)