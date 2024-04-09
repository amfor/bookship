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
from .models import Comment, CommentThread
import json 
from django.middleware.csrf import get_token
from collections import defaultdict
from django.template.loader import render_to_string

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
            csrf_token = get_token(request)
            resources = dict(csrf_token= csrf_token)
            (body, resources) = html_exporter.from_notebook_node(notebook, resources=resources)
            print(resources.keys())
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

def is_new_comment(id):
    return Comment.objects.filter(thread_id=id, file_hash=file_hash, contents=contents).count() == 0

def is_existing_thread(thread_id, file_hash):
    return CommentThread.objects.filter(thread_id=thread_id, file_hash=file_hash).count() > 0

def submit_comment(request):


    if request.method == 'POST':
        # TODO: Internal Authorization Check 
        received_data = json.loads(request.body)
        try:
            if not is_existing_thread(thread_id=received_data.get('thread_id'), file_hash=received_data.get('file_hash')):
                try:
                    new_thread_instance = CommentThread(
                        thread_id=received_data.get('thread_id'),
                        file_hash = received_data.get("file_hash"))
                    new_thread_instance.save()
                except:
                    return JsonResponse({'error': 'Failed to start new thread. '}, status=500)
            new_instance = Comment(
                thread_id=received_data.get('thread_id'),
                previous_comment_id=received_data.get("previous_comment_id"), 
                file_hash = received_data.get("file_hash"), 
                cell_hash = received_data.get("cell_hash"), 
                line_no = received_data.get("line_no"),
                previous_file_hash=received_data.get("previous_file_hash"), 
                contents=received_data.get("contents"), 
                author=received_data.get("author")
            )
            new_instance.save()
            return JsonResponse({'message': 'Data received and saved successfully'}, status=201)
        except:
            # TODO: delete thread if there's an error here 
            return JsonResponse({'error': 'Failed to start new thread.'}, status=500)
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=400)


def load_comments(request, file_hash):
    if request.method == 'GET':
        comments = Comment.objects.filter(file_hash=file_hash).order_by('created_at').values('thread_id', 'file_hash', 'cell_hash', 'line_no', 'created_at', 'author', 'assigned_to', 'resolved', 'contents') 

        from django.template.loader import render_to_string
        for comment in comments:
            #render_to_string("partials/comment_threads", comment)
            print()
        serialized_comments = list(comments)
        return JsonResponse({'comments': serialized_comments})
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=400)        
      

def resolve_thread(request):
    if request.method == 'POST':
        try:
            received_data = json.loads(request.body)
            # TODO: Some internal check user is authorized
            thread = CommentThread.objects.get(thread_id=received_data['thread_id'], file_hash=received_data['file_hash'])
            thread.resolved = True  
            thread.save()
            comment = Comment.objects.filter(thread_id=received_data['thread_id'], file_hash=received_data['file_hash']).first()
            comment.resolved = True  

            
            comment.save()
            return JsonResponse({'error': 'Thread resolved by @saml_author'}, status=200)        

        except Comment.DoesNotExist:
            return JsonResponse({'error': 'Error Occured'}, status=400)        

   
    return JsonResponse({'error': 'Invalid request method'}, status=400)        
            


from django.http import JsonResponse
from django.middleware.csrf import get_token

def get_csrf_token(request):
    csrf_token = get_token(request)
    return JsonResponse({'csrfToken': csrf_token})            

def render_new_thread(request):
    try:

        request_data = {
            "thread_id" :request.GET['thread_id'],
            "line_no":request.GET['line_no'],
            "cell_hash":request.GET['cell_hash'],

        }
        request_data['first_load'] = False # We want style = "flex"
        request_data['thread_comments'] = None
        threads_html = render_to_string(template_name="partials/comment_thread.html", context=request_data)
        return JsonResponse({'html':threads_html})
    except Exception as e:

        return JsonResponse({'error': str(e)}, status=400)


from datetime import datetime
import pytz

def render_threads(request, file_hash):
    custom_header_value = request.META.get('timezone')
    if request.method == 'GET':
        comments = Comment.objects.filter(file_hash=file_hash).order_by('created_at').values('thread_id', 'file_hash', 'cell_hash', 'line_no', 'created_at', 'author', 'assigned', 'resolved', 'contents') 
        

        threads = defaultdict(list)
        for comment in comments:
            threads[comment['thread_id']].append(comment)

        import datetime
        threads_html = render_to_string(template_name="partials/threads.html", context={'threads': dict(threads), 'first_load': True})
        return HttpResponse(threads_html)
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=400)    
    
    