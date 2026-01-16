"""
Cron job to clean up expired JWT tokens from database

This script removes:
1. Expired tokens from OutstandingToken table
2. Blacklisted tokens that are already expired

Run this script daily or weekly to keep database clean.

Usage:
    python cron/cleanup_tokens.py
"""

import os
import sys
import django

# Add project root to Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'isp_billing.settings')
django.setup()

from django.core.management import call_command
from django.utils import timezone


def cleanup_expired_tokens():
    """
    Clean up expired JWT tokens from database
    """
    try:
        call_command('flushexpiredtokens', verbosity=0)
        return True
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False


def get_token_statistics():
    """
    Get token statistics using database-level queries
    """
    try:
        from rest_framework_simplejwt.token_blacklist.models import (
            OutstandingToken, 
            BlacklistedToken
        )
        
        now = timezone.now()
        
        # Database-level queries (Fast)
        total_outstanding = OutstandingToken.objects.count()
        total_blacklisted = BlacklistedToken.objects.count()
        expired_outstanding = OutstandingToken.objects.filter(expires_at__lt=now).count()
        expired_blacklisted = BlacklistedToken.objects.filter(token__expires_at__lt=now).count()
        
        return {
            'total_outstanding': total_outstanding,
            'total_blacklisted': total_blacklisted,
            'expired_outstanding': expired_outstanding,
            'expired_blacklisted': expired_blacklisted,
        }
    except Exception as e:
        print(f"❌ Statistics error: {str(e)}")
        return None


def main():
    """
    Main execution function
    """
    print("\n🧹 JWT Token Cleanup - ISP billing System")
    print("=" * 50)
    
    # Get statistics before cleanup
    stats_before = get_token_statistics()
    
    if stats_before is None:
        return 1
    
    print(f"📊 Tokens before: {stats_before['total_outstanding']} outstanding, {stats_before['total_blacklisted']} blacklisted")
    print(f"🗑️  Expired tokens: {stats_before['expired_outstanding'] + stats_before['expired_blacklisted']}")
    
    # Perform cleanup
    if not cleanup_expired_tokens():
        return 1
    
    # Get statistics after cleanup
    stats_after = get_token_statistics()
    
    if stats_after:
        total_cleaned = stats_before['expired_outstanding'] + stats_before['expired_blacklisted']
        print(f"✅ Cleaned {total_cleaned} expired tokens")
        print(f"📊 Tokens after: {stats_after['total_outstanding']} outstanding, {stats_after['total_blacklisted']} blacklisted")
    
    print("=" * 50)
    print("✅ Cleanup completed!\n")
    return 0


if __name__ == '__main__':
    exit_code = main()
    sys.exit(exit_code)
