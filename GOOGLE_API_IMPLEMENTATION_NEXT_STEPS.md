# Google API Implementation - Next Steps

**Date:** January 11, 2025  
**Purpose:** Guide for implementing actual Google API calls now that OAuth integration is complete

---

## ✅ Current Status

**Completed:**
- ✅ OAuth scopes added to GoogleAuthProvider
- ✅ Access token capture implemented
- ✅ Access token storage in backend
- ✅ Token stored in localStorage for frontend use

**Ready to Implement:**
- ⏳ Google Calendar API integration
- ⏳ Google Contacts API integration
- ⏳ Gmail API integration (optional)

---

## 🎯 Implementation Plan

### Phase 1: Google Calendar API

**Use Cases:**
1. **Sync Calendar Events** - Display user's upcoming events
2. **Availability Management** - Show when user is available/busy
3. **Appointment Booking** - Check availability before booking

**Implementation Steps:**

#### 1. Backend Endpoint: Get Calendar Events

**File:** `backend/server.py`

```python
@api_router.get("/google/calendar/events")
async def get_google_calendar_events(
    current_user: User = Depends(get_current_user),
    max_results: int = 10,
    time_min: Optional[str] = None
):
    """Get user's Google Calendar events"""
    try:
        # Get user's Google access token
        user_doc = await users_collection.find_one({"id": current_user.id})
        access_token = user_doc.get("google_access_token")
        
        if not access_token:
            raise HTTPException(
                status_code=400,
                detail="Google account not connected. Please sign in with Google."
            )
        
        # Call Google Calendar API
        import httpx
        async with httpx.AsyncClient() as client:
            url = "https://www.googleapis.com/calendar/v3/calendars/primary/events"
            params = {
                "maxResults": max_results,
                "singleEvents": "true",
                "orderBy": "startTime"
            }
            
            if time_min:
                params["timeMin"] = time_min
            else:
                # Default to now
                from datetime import datetime, timezone
                params["timeMin"] = datetime.now(timezone.utc).isoformat() + "Z"
            
            response = await client.get(
                url,
                headers={"Authorization": f"Bearer {access_token}"},
                params=params
            )
            
            if response.status_code == 401:
                # Token expired, need to refresh
                raise HTTPException(
                    status_code=401,
                    detail="Google access token expired. Please sign in again."
                )
            
            response.raise_for_status()
            return response.json()
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google Calendar API error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch calendar events: {str(e)}")
```

#### 2. Frontend Component: Calendar Integration

**File:** `frontend/src/components/GoogleCalendarIntegration.jsx` (new file)

```javascript
import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Calendar, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const GoogleCalendarIntegration = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCalendarEvents();
  }, []);

  const fetchCalendarEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/google/calendar/events?max_results=5');
      setEvents(response.data.items || []);
      setError(null);
    } catch (err) {
      if (err.response?.status === 400) {
        setError('Google account not connected');
      } else if (err.response?.status === 401) {
        setError('Please sign in with Google again');
      } else {
        setError('Failed to load calendar events');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Upcoming Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming events</p>
        ) : (
          <ul className="space-y-2">
            {events.map((event) => (
              <li key={event.id} className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="font-medium text-sm">{event.summary || 'No title'}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(event.start?.dateTime || event.start?.date)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleCalendarIntegration;
```

---

### Phase 2: Google Contacts API

**Use Cases:**
1. **Import Contacts** - Allow users to import Google contacts
2. **Suggest Connections** - Recommend contacts to connect with
3. **Quick Add** - Easy way to add contacts to links

**Implementation Steps:**

#### 1. Backend Endpoint: Get Contacts

**File:** `backend/server.py`

```python
@api_router.get("/google/contacts")
async def get_google_contacts(
    current_user: User = Depends(get_current_user),
    max_results: int = 100
):
    """Get user's Google Contacts"""
    try:
        # Get user's Google access token
        user_doc = await users_collection.find_one({"id": current_user.id})
        access_token = user_doc.get("google_access_token")
        
        if not access_token:
            raise HTTPException(
                status_code=400,
                detail="Google account not connected. Please sign in with Google."
            )
        
        # Call Google People API (Contacts API is deprecated, use People API)
        import httpx
        async with httpx.AsyncClient() as client:
            url = "https://people.googleapis.com/v1/people/me/connections"
            params = {
                "personFields": "names,emailAddresses,phoneNumbers",
                "pageSize": max_results
            }
            
            response = await client.get(
                url,
                headers={"Authorization": f"Bearer {access_token}"},
                params=params
            )
            
            if response.status_code == 401:
                raise HTTPException(
                    status_code=401,
                    detail="Google access token expired. Please sign in again."
                )
            
            response.raise_for_status()
            data = response.json()
            
            # Transform to simpler format
            contacts = []
            for person in data.get("connections", []):
                name = person.get("names", [{}])[0].get("displayName", "Unknown")
                email = person.get("emailAddresses", [{}])[0].get("value", "")
                phone = person.get("phoneNumbers", [{}])[0].get("value", "")
                
                if name or email:
                    contacts.append({
                        "name": name,
                        "email": email,
                        "phone": phone,
                        "resourceName": person.get("resourceName", "")
                    })
            
            return {"contacts": contacts}
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google Contacts API error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch contacts: {str(e)}")
```

#### 2. Frontend Component: Contacts Import

**File:** `frontend/src/components/GoogleContactsImport.jsx` (new file)

```javascript
import { useState } from 'react';
import api from '../lib/api';
import { Users, Loader2, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { toast } from 'sonner';

const GoogleContactsImport = ({ onContactsImported }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/google/contacts?max_results=100');
      setContacts(response.data.contacts || []);
    } catch (err) {
      if (err.response?.status === 400) {
        toast.error('Google account not connected');
      } else {
        toast.error('Failed to load contacts');
      }
    } finally {
      setLoading(false);
    }
  };

  const importContact = async (contact) => {
    try {
      // Create a link or contact entry
      // This depends on your data structure
      toast.success(`Imported ${contact.name}`);
      if (onContactsImported) {
        onContactsImported(contact);
      }
    } catch (err) {
      toast.error('Failed to import contact');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Import Google Contacts
        </CardTitle>
        <CardDescription>
          Import contacts from your Google account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={fetchContacts}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading Contacts...
            </>
          ) : (
            <>
              <Users className="w-4 h-4 mr-2" />
              Load Google Contacts
            </>
          )}
        </Button>

        {contacts.length > 0 && (
          <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
            {contacts.slice(0, 10).map((contact, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 border rounded"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{contact.name}</p>
                  {contact.email && (
                    <p className="text-xs text-muted-foreground">{contact.email}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => importContact(contact)}
                  disabled={importing}
                >
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleContactsImport;
```

---

### Phase 3: Gmail API (Optional)

**Use Cases:**
1. **Email Stats** - Show unread count
2. **Quick Actions** - Link to compose email
3. **Email Integration** - Display recent emails (if needed)

**Implementation Steps:**

#### Backend Endpoint: Get Gmail Stats

**File:** `backend/server.py`

```python
@api_router.get("/google/gmail/stats")
async def get_gmail_stats(
    current_user: User = Depends(get_current_user)
):
    """Get user's Gmail statistics (unread count, etc.)"""
    try:
        user_doc = await users_collection.find_one({"id": current_user.id})
        access_token = user_doc.get("google_access_token")
        
        if not access_token:
            raise HTTPException(
                status_code=400,
                detail="Google account not connected"
            )
        
        import httpx
        async with httpx.AsyncClient() as client:
            # Get profile (unread count)
            profile_url = "https://gmail.googleapis.com/gmail/v1/users/me/profile"
            profile_response = await client.get(
                profile_url,
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            if profile_response.status_code == 401:
                raise HTTPException(status_code=401, detail="Token expired")
            
            profile_response.raise_for_status()
            profile = profile_response.json()
            
            return {
                "email_address": profile.get("emailAddress", ""),
                "messages_total": profile.get("messagesTotal", 0),
                "threads_total": profile.get("threadsTotal", 0),
                "history_id": profile.get("historyId", "")
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Gmail API error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch Gmail stats: {str(e)}")
```

---

## 🔐 Token Refresh Implementation

**Important:** Access tokens expire (typically 1 hour). You need to handle token refresh.

### Option 1: Use Refresh Token (Recommended)

**Update Backend to Store Refresh Token:**

```python
# In google_signin endpoint, also capture refresh token
# Note: Refresh token is only provided on first consent
# You'll need to extract it from the OAuth credential
```

### Option 2: Re-authenticate (Simpler)

**Frontend:** Prompt user to sign in again when token expires:

```javascript
// In API interceptor or component
if (error.response?.status === 401 && error.response?.data?.detail?.includes('token expired')) {
  toast.error('Google session expired. Please sign in again.');
  // Redirect to auth page or trigger re-login
}
```

---

## 📋 Implementation Checklist

### Calendar API
- [ ] Create backend endpoint `/google/calendar/events`
- [ ] Add error handling for expired tokens
- [ ] Create frontend component for calendar display
- [ ] Add calendar integration to dashboard
- [ ] Test with real Google Calendar

### Contacts API
- [ ] Create backend endpoint `/google/contacts`
- [ ] Update OAuth scopes if needed (People API)
- [ ] Create frontend component for contacts import
- [ ] Add contacts import to settings/profile
- [ ] Test with real Google Contacts

### Gmail API (Optional)
- [ ] Create backend endpoint `/google/gmail/stats`
- [ ] Create frontend component for email stats
- [ ] Add email stats to dashboard (optional)
- [ ] Test with real Gmail account

### General
- [ ] Add token refresh logic
- [ ] Add error handling for disconnected accounts
- [ ] Add UI for connecting/disconnecting Google account
- [ ] Update privacy policy
- [ ] Test all integrations

---

## 🚀 Quick Start Implementation Order

1. **Start with Calendar API** (most useful for your platform)
   - Implement backend endpoint
   - Create simple frontend component
   - Test and iterate

2. **Then Contacts API** (useful for social features)
   - Implement backend endpoint
   - Create import component
   - Integrate into profile/settings

3. **Gmail API** (optional, lower priority)
   - Only if email features are needed
   - Can be added later

---

## ⚠️ Important Notes

### 1. Google Cloud Console Setup

**Required:**
- Enable APIs in Google Cloud Console:
  - Calendar API
  - People API (for contacts)
  - Gmail API (if using)

- OAuth Consent Screen:
  - Add scopes to consent screen
  - Update privacy policy
  - Submit for verification (for sensitive scopes)

### 2. API Quotas

- **Calendar API:** 1,000,000 queries/day
- **People API:** 50,000 queries/day
- **Gmail API:** 1,000 queries/day (for basic usage)

### 3. Rate Limiting

- Implement rate limiting in backend
- Handle 429 (Too Many Requests) errors
- Cache responses when appropriate

### 4. Security

- **Never** expose access tokens to frontend (already stored, but be careful)
- **Always** validate user ownership of token
- **Encrypt** tokens in database (recommended)
- **Clear** tokens on account disconnect

---

## 📚 API Documentation References

- **Calendar API:** https://developers.google.com/calendar/api
- **People API:** https://developers.google.com/people/api
- **Gmail API:** https://developers.google.com/gmail/api
- **OAuth 2.0:** https://developers.google.com/identity/protocols/oauth2

---

## ✅ Summary

**Current Status:**
- ✅ OAuth integration complete
- ✅ Access tokens stored
- ⏳ Ready to implement API calls

**Next Steps:**
1. Choose which APIs to implement first (recommend Calendar)
2. Create backend endpoints
3. Create frontend components
4. Test with real Google accounts
5. Handle token refresh/errors
6. Add to UI

---

**Last Updated:** January 11, 2025  
**Status:** Ready to implement Google API calls
