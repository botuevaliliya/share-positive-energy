from django.contrib.auth import authenticate, logout
from django.conf import settings
from django.middleware import csrf
from django.core.mail import send_mail
from rest_framework import exceptions as rest_exceptions, response, decorators as rest_decorators, permissions as rest_permissions
from rest_framework_simplejwt import tokens, views as jwt_views, serializers as jwt_serializers, exceptions as jwt_exceptions
from user import serializers, models
from django.utils.crypto import get_random_string

from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import Feedback, Emails, User
from .serializers import FeedbackSerializer, UserSerializer, EmailsSerializer, MyFeedbackSerializer, AddEmailsSerializer, LoginSerializer, RegistrationSerializer

from rest_framework import generics, permissions

from django.shortcuts import get_object_or_404

from django.http import JsonResponse

from .forms import CustomPasswordChangeForm
from django.http import HttpResponse


from django.contrib.auth.hashers import make_password
from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from transformers import AutoModelForSequenceClassification, AutoTokenizer, pipeline
import torch
from django.utils.html import format_html

from django.template.loader import render_to_string
import logging
logger = logging.getLogger(__name__)

MODEL_NAME = "cardiffnlp/twitter-xlm-roberta-base-sentiment"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, use_fast=False)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)



def get_user_tokens(user):
    refresh = tokens.RefreshToken.for_user(user)
    return {
        "refresh_token": str(refresh),
        "access_token": str(refresh.access_token)
    }

def mask_email(email):
    try:
        local, domain = email.split('@')
        if len(local) <= 1:
            masked_local = '*'
        elif len(local) == 2:
            masked_local = local[0] + '*'
        else:
            masked_local = local[0] + '*' * (len(local) - 2) + local[-1]
        return f"{masked_local}@{domain}"
    except Exception:
        return email



@rest_decorators.api_view(["POST"])
@rest_decorators.permission_classes([])
def loginView(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data["email"]
    password = serializer.validated_data["password"]

    user = authenticate(email=email, password=password)

    if user is not None:
        if not user.is_active:
           raise rest_exceptions.AuthenticationFailed("Email not confirmed!")

        tokens = get_user_tokens(user)
        res = response.Response()
        res.set_cookie(
            key=settings.SIMPLE_JWT['AUTH_COOKIE'],
            value=tokens["access_token"],
            expires=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'],
            secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
            httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
            samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
        )

        res.set_cookie(
            key=settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'],
            value=tokens["refresh_token"],
            expires=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'],
            secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
            httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
            samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
        )

        res.data = tokens
        res["X-CSRFToken"] = csrf.get_token(request)
        return res
    if not Emails.objects.filter(email_main=email).exists():
       print('Email does not exits')
       return response.Response({"message": "Email does not exist, please sign up."},status=404)
    raise rest_exceptions.AuthenticationFailed("Email or Password is incorrect!")


@rest_decorators.api_view(["POST"])
@rest_decorators.permission_classes([])
def registerView(request):
    logger.info(f"Received request for user registration: {request.data}")

    email = request.data.get("email")
    first_name = request.data.get("first_name")
    password = request.data.get("password")

    existing_user = User.objects.filter(email=email).first()

    if existing_user:
        if existing_user.email_confirmed:
            return Response("Email already registered and confirmed!", status=status.HTTP_400_BAD_REQUEST)
        else:
            logger.info("Email exists but not confirmed. Regenerating confirmation code.")
            existing_user.first_name = first_name
            existing_user.set_password(password)
            confirmation_code = get_random_string(length=6, allowed_chars='0123456789')
            existing_user.confirmation_code = confirmation_code
            existing_user.save()
    else:
        serializer = RegistrationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        user = serializer.save()
        # user.is_active = True
        confirmation_code = get_random_string(length=6, allowed_chars='0123456789')
        user.confirmation_code = confirmation_code
        user.save()

    subject = "Welcome welcome friend!"
    html_message = render_to_string("emails/registration_email.html", {
        "first_name": first_name,
        "confirmation_code": confirmation_code,
    })

    try:
        send_mail(
            subject,
            f'Your confirmation code is: {confirmation_code}',
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
            html_message=html_message,
        )
        logger.info(f"Sent confirmation code: {confirmation_code} to {email}")
    except Exception as e:
        logger.error(f"Failed to send email to {email}: {e}")
        return Response("Could not send confirmation email. Please try again later.", status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response("Registered or confirmation code resent!")


@rest_decorators.api_view(["POST"])
@rest_decorators.permission_classes([])
def confirmEmailView(request):
    email = request.data.get('email')
    confirmation_code = request.data.get('confirmation_code')

    try:
        user = models.User.objects.get(email=email)
    except models.User.DoesNotExist:
        raise rest_exceptions.NotFound("User not found.")

    if user.confirmation_code == confirmation_code:
        user.email_confirmed = True
        user.confirmation_code = confirmation_code
        user.is_active = True
        user.is_stuff = False
        user.save()
        Emails.objects.create(email_main=user, email_additional=email, verification_code=confirmation_code, new_email_verified=True)
        return response.Response("Email confirmed successfully!")
    else:
        raise rest_exceptions.ValidationError("Invalid confirmation code.")


@rest_decorators.api_view(['POST'])
@rest_decorators.permission_classes([rest_permissions.IsAuthenticated])
def logoutView(request):
    try:
        refreshToken = request.COOKIES.get(
            settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'])
        token = tokens.RefreshToken(refreshToken)
        token.blacklist()

        res = response.Response()
        res.delete_cookie(settings.SIMPLE_JWT['AUTH_COOKIE'])
        res.delete_cookie(settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'])
        res.delete_cookie("X-CSRFToken")
        res.delete_cookie("csrftoken")
        res["X-CSRFToken"]=None
        return res
    except:
        raise rest_exceptions.ParseError("Invalid token")


class CookieTokenRefreshSerializer(jwt_serializers.TokenRefreshSerializer):
    refresh = None

    def validate(self, attrs):
        attrs['refresh'] = self.context['request'].COOKIES.get('refresh')
        if attrs['refresh']:
            return super().validate(attrs)
        else:
            raise jwt_exceptions.InvalidToken(
                'No valid token found in cookie \'refresh\'')


class CookieTokenRefreshView(jwt_views.TokenRefreshView):
    serializer_class = CookieTokenRefreshSerializer

    def finalize_response(self, request, response, *args, **kwargs):
        if response.data.get("refresh"):
            response.set_cookie(
                key=settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'],
                value=response.data['refresh'],
                expires=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'],
                secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
            )

            del response.data["refresh"]
        response["X-CSRFToken"] = request.COOKIES.get("csrftoken")
        return super().finalize_response(request, response, *args, **kwargs)


@rest_decorators.api_view(["GET"])
@rest_decorators.permission_classes([rest_permissions.IsAuthenticated])
def user(request):
    try:
        user = models.User.objects.get(id=request.user.id)
    except models.User.DoesNotExist:
        return response.Response(status_code=404)

    serializer = serializers.UserSerializer(user)
    return response.Response(serializer.data)


@api_view(['POST'])
@permission_classes([])
def send_feedback(request):
    email_from = request.user.email if request.user.is_authenticated else None
    email_to = request.data.get('email_to')
    content = request.data.get('content')

    # sentiment_score = TextBlob(content).sentiment.polarity
    # sentiment = "positive" if sentiment_score > 0 else "negative" if sentiment_score < 0 else "neutral"
    # print('RESULT TEXTBLOB : ', content, ' IS ', sentiment)

    # analyzer = SentimentIntensityAnalyzer()
    # score = analyzer.polarity_scores(content)['compound']
    # sentiment = "positive" if score > 0.05 else "negative" if score < -0.05 else "neutral"
    # print('RESULT VADER : ', content, ' IS ', sentiment)

    #MODEL_NAME = "cardiffnlp/twitter-xlm-roberta-base-sentiment"
    #tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, use_fast=False)
    #model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)
    sentiment_pipeline = pipeline("sentiment-analysis", model=model, tokenizer=tokenizer)
    LABEL_MAP = {"LABEL_0": "negative", "LABEL_1": "positive"}
    result = sentiment_pipeline(content)[0]
    #print('RESULT HUGGING FACE : ', content, ' IS ', result)

    if result['label'] == 'negative':
        return Response({"message": "NEGATIVE"}, status=status.HTTP_200_OK)

    if email_to not in Feedback.objects.values_list('email_to', flat=True):
        html_message = render_to_string("emails/receiver_first_note.html", {"email": email_to})
        try:
            send_mail(
                subject='Share positive energy',
                message='You have received a new message on Share Positive Energy!',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email_to],
                fail_silently=True,
                html_message=html_message,
            )
        except Exception as e:
            logger.error(f"Failed to send email to {email_to}: {e}")

    feedback = Feedback.objects.create(email_from=email_from, email_to=email_to, content=content)


    return Response({
        "id": feedback.id,
        "email_from": feedback.email_from,
        "email_to": feedback.email_to,
        "content": feedback.content
    }, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([])
def list_emails(request):
    # serializer = EmailsSerializer(then_list, many=True)
    if request.user.is_authenticated:
        # then_list = Feedback.objects.exclude(email_to__in=request.user).values_list('email_to', flat=True).distinct()
        myemails_list = list(Emails.objects.filter(email_main=request.user).values_list('email_additional', flat=True))
        emails = list(Emails.objects.exclude(email_additional__in=myemails_list).values_list('email_additional', flat=True))
        unregistered_users = list(Feedback.objects.exclude(email_to__in=emails).exclude(email_to__in=myemails_list).values_list('email_to', flat=True))
        then_list = list(set(emails + unregistered_users))
    else:
        then_list = Feedback.objects.values_list('email_to', flat=True).distinct()
    return Response(then_list)


@api_view(['GET'])
@permission_classes([])
def user_feedback(request):
    needed_user = request.GET.get('otherUser')
    if request.user.is_authenticated:
        myemails = list(Emails.objects.filter(email_additional=needed_user).values_list('email_main', flat=True))
        myemails_list = list(Emails.objects.filter(email_main__in=myemails).values_list('email_additional', flat=True))
        feedback = Feedback.objects.filter(email_to__in=myemails_list).exclude(email_from__in=myemails_list)
    else:
        feedback = Feedback.objects.filter(email_to=needed_user)
    serializer = MyFeedbackSerializer(feedback, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def your_feedback(request):
    needed_user = request.GET.get('otherUser')
    myemails = list(Emails.objects.filter(email_additional=needed_user).values_list('email_main', flat=True))
    myemails_list = list(Emails.objects.filter(email_main__in=myemails).values_list('email_additional', flat=True))
    feedback = Feedback.objects.filter(email_to__in=myemails_list).exclude(email_from__in=myemails_list)
    serializer = MyFeedbackSerializer(feedback, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([])
def check_email(request):
    email = request.GET.get('email')
    exists = User.objects.filter(email=email).exists()
    return JsonResponse({'exists': exists})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    form = CustomPasswordChangeForm(request.user, request.data)
    print(form.is_valid())
    if form.is_valid():
        request.user = form.save()
        return Response({"detail": "Password has been changed successfully."}, status=status.HTTP_200_OK)
    return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)


@rest_decorators.api_view(["POST"])
@rest_decorators.permission_classes([])
def sendConfirmEmailView(request):
    print(request.data, request.data['email'], request.data['confirmation_code'], request.user)
    confirmation_code = request.data['confirmation_code']
    user = models.Emails.objects.get(email_additional=request.data['email'], email_main=request.data['user_email'])

    if user.verification_code == confirmation_code:
        user.new_email_verified = True
        user.save()
        return response.Response("Email confirmed successfully!")
    else:
        raise rest_exceptions.ValidationError("Invalid confirmation code.")


@rest_decorators.api_view(["POST"])
@rest_decorators.permission_classes([IsAuthenticated])
def addNewEmailView(request):
    print(request.user, request.data)
    confirmation_code = get_random_string(length=6, allowed_chars='0123456789')
    Emails.objects.create(email_main=request.user, email_additional=request.data, verification_code=confirmation_code)

    send_mail(
        'Confirm Your Email',
        f'Your confirmation code is: {confirmation_code}',
        settings.DEFAULT_FROM_EMAIL,
        [request.data],
        fail_silently=False,
    )
    return response.Response("New email added! Please check your email to confirm.")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_list_emails(request):
    emails = Emails.objects.filter(email_main=request.user, new_email_verified=True)
    serializer = EmailsSerializer(emails, many=True)
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_feedback(request, feedback_id):
    needed_user = request.user
    myemails = list(Emails.objects.filter(email_additional=needed_user).values_list('email_main', flat=True))
    myemails_list = list(Emails.objects.filter(email_main__in=myemails).values_list('email_additional', flat=True))
    feedback = Feedback.objects.get(id=feedback_id, email_from__in=myemails_list)
    feedback.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_email(request, email):
    print('QUERY ', email,' to be deleted!', request.user, str(email) == str(request.user))
    if str(email) == str(request.user):
        logout(request)
        Emails.objects.filter(email_main=email).delete()
        user = User.objects.get(email=email)
        user.delete()
        return Response({"message": "Email deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
    try:
        email_record = Emails.objects.get(email_additional=email, email_main=request.user)
        email_record.delete()
        return Response({"message": "Email deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
    except Emails.DoesNotExist:
        return Response({"error": "Email not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




@api_view(["POST"])
def request_password_reset(request):
    data = request.data
    email = data.get("email")
    new_password = data.get("password")

    try:
        user = User.objects.get(email=email)
        confirmation_code = get_random_string(length=6, allowed_chars="0123456789")

        user.set_password(new_password)
        user.confirmation_code = confirmation_code
        user.email_confirmed = False
        user.save()

        send_mail(
            "Confirm Your Password Reset",
            f"Dw pal, we got you :) Your verification code is: {confirmation_code}",
            "no-reply@yourapp.com",
            [email],
            fail_silently=False,
        )

        return Response(
            {"message": "A confirmation code has been sent to your email."},
            status=status.HTTP_200_OK,
        )

    except User.DoesNotExist:
        return Response({"error": "User with this email does not exist."}, status=status.HTTP_404_NOT_FOUND)


@api_view(["POST"])
def reset_password(request):
    data = request.data
    email = data.get("email")
    confirmation_code = data.get("confirmation_code")
    print('ERROR?', email, confirmation_code)

    user = User.objects.get(email=email)

    if user.confirmation_code != confirmation_code:
        return Response({"error": "Invalid confirmation code."}, status=status.HTTP_400_BAD_REQUEST)

    user.email_confirmed = True
    user.save()

    return Response(
        {"message": "Password reset successfully! You can now log in."},
        status=status.HTTP_200_OK,
    )
