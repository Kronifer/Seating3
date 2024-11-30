from email.message import EmailMessage
from os import environ
from smtplib import SMTP


def send_email(from_addr, to_addr, subject, content):
    msg = EmailMessage()
    msg["To"] = to_addr
    msg["From"] = from_addr
    msg["Subject"] = subject
    msg.set_content(content)
    with SMTP(environ["POSTFIX_CONN"]) as s:
        s.send_message(msg)
