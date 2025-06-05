from enum import unique
from django.db import models
from django.contrib.auth.models import BaseUserManager, AbstractBaseUser
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **kwargs):
        if not email:
            raise ValueError("Email is required")
        user = self.model(email=self.normalize_email(email))
        user.set_password(password)
        user.save(using=self._db)
        return user
    def create_superuser(self, email, password, **kwargs):
        user = self.create_user(email=self.normalize_email(email),password=password)
        user.first_name = kwargs.get('first_name')
        user.is_admin = True
        user.is_superuser = True
        user.is_staff = True
        user.save(using=self._db)
        return


class User(AbstractBaseUser):
    email = models.EmailField(null=False, blank=False, unique=True)
    first_name = models.CharField(max_length=50, blank=False, null=False, default='Default first name')
    is_admin = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False) 
    is_active = models.BooleanField(default=True)
    is_superuser = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    email_confirmed = models.BooleanField(default=False)
    confirmation_code = models.CharField(max_length=6, blank=True, null=True)
    objects = UserManager()
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name']
    def __str__(self):
        return self.email
    def has_perm(self, perm, obj=None):
        return True
    def has_module_perms(self, app_label):
        return True


class Emails(models.Model):
    # email_main = models.ForeignKey(User, to_field='email', related_name='email_main', on_delete=models.CASCADE)
    email_main = models.EmailField()
    email_additional = models.TextField()
    verification_code = models.CharField(max_length=6, blank=True, null=True)
    new_email_verified = models.BooleanField(default=False)
    class Meta:
        unique_together = ('email_main', 'email_additional')

class Feedback(models.Model):
    content = models.TextField()
    #email_from = models.ForeignKey(User, to_field='email', on_delete=models.CASCADE, null=True, blank=True)
    email_from = models.EmailField(null=True, blank=True, unique=False)
    email_to = models.EmailField(null=False, blank=False, unique=False)

