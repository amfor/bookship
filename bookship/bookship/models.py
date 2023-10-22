from django.db import models

class UploadedFile(models.Model):
    file1 = models.FileField(upload_to='compare/')
    file2 = models.FileField(upload_to='compare/')
