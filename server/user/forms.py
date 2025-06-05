from django import forms
from django.contrib.auth.forms import PasswordChangeForm
from django.contrib.auth import get_user_model

User = get_user_model()
class CustomPasswordChangeForm(PasswordChangeForm):
    class Meta:
        model = User  # Your user model
        fields = []