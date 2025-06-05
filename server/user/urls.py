from django.urls import path
from user.views import loginView, registerView, CookieTokenRefreshView, logoutView, user,\
    confirmEmailView, list_emails, user_feedback, send_feedback, check_email, change_password, \
        addNewEmailView, sendConfirmEmailView, my_list_emails, delete_feedback,\
        request_password_reset, reset_password, delete_email, your_feedback

app_name = "user"

urlpatterns = [
    path('login/', loginView, name='login'),
    path('register/', registerView, name='register'),
    path('refresh-token/', CookieTokenRefreshView.as_view(), name='refresh_token'),
    path('logout/', logoutView, name='logout'),
    path("user/", user, name='user'),
    path('confirm-email/', confirmEmailView, name='confirm_email'),
    path('emails/', list_emails, name='list_emails'),
    path('send_feedback/', send_feedback, name='send_feedback'),
    path('user_feedback/', user_feedback, name='user_feedback'),
    path('your_feedback/', your_feedback, name='your_feedback'),
    path('check-email/', check_email, name='check_email'),
    path('change-password/', change_password, name='change_password'),
    path('add-email/', addNewEmailView, name='addNewEmailView'),
    path('confirm-new-email/', sendConfirmEmailView, name='sendConfirmEmailView'),
    path('get-my-emails/', my_list_emails, name='my_list_emails'),
    path('delete-feedback/<str:feedback_id>/', delete_feedback, name='delete_feedback'),
    path('forgot-password/', request_password_reset, name='request_password_reset'),
    path('reset-password/', reset_password, name='reset_password'),
    path('delete-email/<str:email>/', delete_email, name='delete_email')
]
