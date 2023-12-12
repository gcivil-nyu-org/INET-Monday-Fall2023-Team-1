from django.test import TestCase
from django.urls import reverse, resolve
from .. import views


class UrlTests(TestCase):
    def test_user_registration_url_resolves(self):
        url = reverse("user-registration")
        self.assertEqual(resolve(url).func.view_class, views.UserRegistrationView)

    def test_user_login_url_resolves(self):
        url = reverse("user-login")
        self.assertEqual(resolve(url).func.view_class, views.UserLoginView)

    def test_user_logout_url_resolves(self):
        url = reverse("user-logout")
        self.assertEqual(resolve(url).func, views.logout_view)

    def test_user_session_view_url_resolves(self):
        url = reverse("user-session-view")
        self.assertEqual(resolve(url).func, views.session_view)

    def test_user_whoami_view_url_resolves(self):
        url = reverse("user-whoami")
        self.assertEqual(resolve(url).func, views.whoami_view)

    def test_user_info_url_resolves(self):
        url = reverse("user-info")
        self.assertEqual(resolve(url).func, views.user_view)
