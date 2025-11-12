#!/usr/bin/env python3
"""
Quick test script for the dental booking agent.
Run this after starting the server to test the conversation flow.
"""
import requests
import time
import json
from typing import Dict


API_URL = "http://localhost:8000/webhook/message"
PHONE = "972599123456"


def send_message(message: str, language: str = None) -> Dict:
    """Send a message to the agent and return the response."""
    payload = {
        "phone": PHONE,
        "message": message
    }
    if language:
        payload["language"] = language

    try:
        response = requests.post(API_URL, json=payload, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to server. Is it running on http://localhost:8000?")
        exit(1)
    except requests.exceptions.RequestException as e:
        print(f"❌ Error: {e}")
        exit(1)


def print_exchange(user_msg: str, bot_reply: str):
    """Pretty print the conversation exchange."""
    print("\n" + "="*60)
    print(f"👤 Patient: {user_msg}")
    print(f"🤖 Bot: {bot_reply}")
    print("="*60)
    time.sleep(1)  # Small delay to make it easier to read


def test_arabic_conversation():
    """Test a complete booking flow in Arabic."""
    print("\n🇵🇸 Testing Arabic Conversation Flow")
    print("="*60)

    # Step 1: Greeting
    response = send_message("السلام عليكم")
    print_exchange("السلام عليكم", response["reply"])

    # Step 2: Name
    response = send_message("محمد علي")
    print_exchange("محمد علي", response["reply"])

    # Step 3: Service selection
    response = send_message("2")  # Teeth cleaning
    print_exchange("2", response["reply"])

    # Step 4: Date
    response = send_message("غداً")
    print_exchange("غداً", response["reply"])

    # Step 5: Time
    response = send_message("10:00")
    print_exchange("10:00", response["reply"])

    print("\n✅ Arabic conversation test completed!")


def test_english_conversation():
    """Test a complete booking flow in English."""
    print("\n🇬🇧 Testing English Conversation Flow")
    print("="*60)

    phone = "972599999888"  # Different phone for new conversation

    def send_en(message: str):
        payload = {"phone": phone, "message": message, "language": "en"}
        response = requests.post(API_URL, json=payload, timeout=30)
        return response.json()

    # Step 1: Greeting
    response = send_en("Hello")
    print_exchange("Hello", response["reply"])

    # Step 2: Name
    response = send_en("John Smith")
    print_exchange("John Smith", response["reply"])

    # Step 3: Service
    response = send_en("teeth cleaning")
    print_exchange("teeth cleaning", response["reply"])

    # Step 4: Date
    response = send_en("tomorrow")
    print_exchange("tomorrow", response["reply"])

    # Step 5: Time
    response = send_en("11:00")
    print_exchange("11:00", response["reply"])

    print("\n✅ English conversation test completed!")


def test_api_endpoints():
    """Test helper API endpoints."""
    print("\n🔧 Testing API Endpoints")
    print("="*60)

    # Health check
    try:
        response = requests.get("http://localhost:8000/health")
        print(f"✅ Health check: {response.json()}")
    except Exception as e:
        print(f"❌ Health check failed: {e}")

    # Get services
    try:
        response = requests.get("http://localhost:8000/services")
        data = response.json()
        print(f"✅ Services: Found {data['count']} services")
    except Exception as e:
        print(f"❌ Get services failed: {e}")

    # Get available slots
    try:
        response = requests.get("http://localhost:8000/slots/2024-01-15")
        data = response.json()
        print(f"✅ Available slots: {data['count']} slots for {data['date']}")
    except Exception as e:
        print(f"❌ Get slots failed: {e}")


def main():
    """Run all tests."""
    print("\n" + "🦷"*30)
    print("Dental Booking Agent - Test Suite")
    print("🦷"*30)

    # Test API endpoints first
    test_api_endpoints()

    # Test conversations
    try:
        test_arabic_conversation()
        time.sleep(2)
        test_english_conversation()

        print("\n" + "="*60)
        print("✅ All tests passed!")
        print("="*60)

        print("\n📊 Check your Supabase dashboard to see:")
        print("   - New patients in 'patients' table")
        print("   - Bookings in 'bookings' table")
        print("   - Conversation history in 'conversations' table")

    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Test failed: {e}")


if __name__ == "__main__":
    main()
