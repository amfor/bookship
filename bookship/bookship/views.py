from django.shortcuts import render
from django.conf import settings
from django.views.generic.edit import FormView
from .forms import FileUploadForm
from .models import UploadedFile 
import nbformat
from nbconvert import HTMLExporter
from nbformatting.review_exporter import MyExporter
from nbformatting.diff_exporter import DiffExporter

# Commenting Imports
from django.http import JsonResponse
from .models import Comment 
import json 


def index(request):
    return render(request, 'bookship/index.html')

class FileUploadView(FormView):
    template_name = 'compare.html'
    form_class = FileUploadForm
    success_url = '/generated_html/'

    def form_valid(self, form):
        form.save()

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
    APP_ID = '398519'
    INSTALLATION_ID = '43170684'
    REPO_OWNER = 'amfor'
    REPO_NAME = 'nbdiff'
    FILE_PATH = 'src/mynotebook2.ipynb'

    payload = {
        'iat': int(time.time()),
        'exp': int(time.time()) + 60,
        'iss': APP_ID
    }
    jwt_token = jwt.encode(payload, GITHUB_PRIVATE_KEY, algorithm='RS256')

    headers = {
        'Authorization': f'Bearer {jwt_token}',
        'Accept': 'application/vnd.github.machine-man-preview+json'
    }
    access_token_response = requests.post(f'https://api.github.com/app/installations/{INSTALLATION_ID}/access_tokens', headers=headers)

    access_token = access_token_response.json().get('token')

    file_content_response = requests.get(f'https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/contents/{FILE_PATH}', headers={'Authorization': f'Bearer {access_token}'})
    file_content = file_content_response.json().get('content')

    if file_content_response.status_code == 200:
        file_content = file_content_response.json().get('content')
        
        if file_content:
            import base64
            decoded_content = base64.b64decode(file_content).decode('utf-8')

            html_exporter = MyExporter(template_name='lab')
            notebook = nbformat.reads(decoded_content, as_version=4)
            (body, resources) = html_exporter.from_notebook_node(notebook)
            return HttpResponse(body)

        else:
            return HttpResponse("File content is empty or not found")
    else:
        return HttpResponse(f"Failed to fetch file content. Status code: {file_content_response.status_code}")

    return HttpResponse(decoded_content)




def diff_integration(request):
 
    import json
    def readfile(path):
        with open(path, 'r') as f:
            return nbformat.reads(f.read(), as_version=4)
    a = readfile("/Users/amy/code/nbdiff/bookship/compare/mynotebook.ipynb")
    b = readfile("/Users/amy/code/nbdiff/bookship/compare/mynotebook2.ipynb")


    html_exporter = DiffExporter()
    (body, resources) = html_exporter.from_notebook_node(nb=a, diff=b)
    return HttpResponse(body)

from django.views.decorators.csrf import csrf_exempt, csrf_protect


@csrf_exempt
def submit_comment(request):
    if request.method == 'POST':
        received_data = json.loads(request.body)
        
        new_instance = Comment(
            thread_id=received_data.get('thread_id'),
            previous_comment_id=received_data.get("previous_comment_id"), 
            file_hash = received_data.get("file_hash"), 
            cell_hash = received_data.get("cell_hash"), 
            line_no = received_data.get("line_no"),
            previous_file_hash=received_data.get("previous_file_hash"), 
            contents=received_data.get("contents"), 
            author=received_data.get("author"), 
            assigned=received_data.get("assigned"), 
            resolved=received_data.get("resolved")
        )
        new_instance.save()

        return JsonResponse({'message': 'Data received and saved successfully'}, status=201)
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=400)


def load_comments(request, file_hash):
    if request.method == 'GET':
        comments = Comment.objects.filter(file_hash=file_hash).order_by('created_at').values('thread_id', 'file_hash', 'cell_hash', 'line_no', 'created_at', 'author', 'assigned', 'resolved', 'contents') 

        for comment in comments:
            print(comment)
        
        serialized_comments = list(comments)
        return JsonResponse({'comments': serialized_comments})
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=400)        
      

def resolve_thread(request, file_hash):
    if request.method == 'POST':
        try:
            received_data = json.loads(request.body)

            comment = Comment.objects.get(thread_id=received_data['thread_id'])
            comment.your_boolean_field = True  
            comment.save()
            return JsonResponse({'error': 'Invalid request method'}, status=400)        

        except Comment.DoesNotExist:
            return JsonResponse({'error': 'Error Occured'}, status=400)        

   
    return JsonResponse({'error': 'Invalid request method'}, status=400)        
            


from django.http import JsonResponse
from django.middleware.csrf import get_token

def get_csrf_token(request):
    csrf_token = get_token(request)
    return JsonResponse({'csrfToken': csrf_token})            