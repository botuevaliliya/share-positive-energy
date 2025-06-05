from rest_framework import serializers
from django.conf import settings
from django.contrib.auth import get_user_model
from .models import Feedback, Emails


class RegistrationSerializer(serializers.ModelSerializer):

    class Meta:
        model = get_user_model()
        fields = ("first_name", "email", "password")
        extra_kwargs = {
            "password": {"write_only": True}
        }

    def save(self):
        user = get_user_model()(
            email=self.validated_data["email"],
            first_name=self.validated_data["first_name"],
        )

        password = self.validated_data["password"]

        user.set_password(password)
        user.save()

        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(
        style={"input_type": "password"}, write_only=True)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ["id", "is_staff", "email", "first_name"]


class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ['content', 'email_to']
        # read_only_fields = ['email_from']


class EmailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Emails
        fields = ['email_additional', 'email_main']

class MyFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ['id', 'content']

class AddEmailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Emails
        fields = ['email_main_id', 'email_additional']
