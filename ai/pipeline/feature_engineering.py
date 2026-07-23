def calculate_reply_rate(replies, total_emails):
    if total_emails == 0:
        return 0
    return replies / total_emails