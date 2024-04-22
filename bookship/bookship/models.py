from django.db import models

class Notebooks(models.Model):
    id = models.AutoField(primary_key=True)    
    file_hash = models.CharField(max_length=256)
    original_file_hash = models.CharField(max_length=256)
    previous_file_hash = models.CharField(max_length=256)
    uploader = models.CharField(max_length=128)
    resource_location = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'bookship'



class UploadedFile(models.Model):
    file1 = models.FileField(upload_to='compare/')
    file2 = models.FileField(upload_to='compare/')
    class Meta:
        app_label = 'bookship'


class CommentThread(models.Model):
    id = models.AutoField(primary_key=True)    
    thread_id = models.CharField(max_length=56)
    file_hash = models.CharField(max_length=56)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved = models.BooleanField(default=False)
    resolved_by = models.CharField(default="nobody@bookship.net", max_length=128)
    assigned_to = models.CharField(default="nobody@bookship.net", max_length=128)

    class Meta:
        app_label = 'bookship'



class Comment(models.Model):
    id = models.AutoField(primary_key=True)    
    thread_id = models.CharField(max_length=128)
    file_hash = models.CharField(max_length=256)
    cell_hash = models.CharField(max_length=32)   
    line_no = models.CharField(max_length=32)
    previous_comment_id = models.CharField(max_length=56)
    previous_file_hash = models.CharField(max_length=256)
    contents = models.CharField(max_length=2048)
    author = models.CharField(max_length=128)
    assigned_to = models.CharField(default='nobody', max_length=128)
    resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        app_label = 'bookship'