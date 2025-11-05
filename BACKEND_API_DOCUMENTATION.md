# Backend API - Add About, Hours, Services

## Database Schema (PostgreSQL)

```sql
ALTER TABLE doctors
ADD COLUMN about TEXT,
ADD COLUMN hours JSONB,
ADD COLUMN services JSONB;
```

## Spring Boot Entity

```java
@Column(columnDefinition = "TEXT")
private String about;

@Type(type = "jsonb")
@Column(columnDefinition = "jsonb")
private List<WorkingHours> hours;

@Type(type = "jsonb")
@Column(columnDefinition = "jsonb")
private List<String> services;
```

## WorkingHours Class

```java
public class WorkingHours {
    private String day;
    private String openTime;
    private String closeTime;
    private Boolean isClosed;
    
    // getters, setters, constructors
}
```

## Request/Response DTO

Add to `DoctorRequestDto` and `DoctorResponseDto`:

```java
private String about;
private List<WorkingHours> hours;
private List<String> services;
```

## Example JSON Payload

```json
{
  "email": "doctor@example.com",
  "name": "Dr. John Smith",
  "specialization": "Cardiology",
  "phoneNumber": "+212 123 456 789",
  "location": {
    "latitude": 35.7595,
    "longitude": -5.8337,
    "address": "123 Medical Street",
    "city": "Tétouan"
  },
  "about": "Experienced cardiologist with 15+ years of practice.",
  "hours": [
    {
      "day": "Mon - Fri",
      "openTime": "09:00",
      "closeTime": "17:00",
      "isClosed": false
    },
    {
      "day": "Saturday",
      "openTime": "09:00",
      "closeTime": "13:00",
      "isClosed": false
    },
    {
      "day": "Sunday",
      "openTime": "",
      "closeTime": "",
      "isClosed": true
    }
  ],
  "services": [
    "General Consultation",
    "Health Checkups",
    "Prescriptions",
    "Follow-up Care"
  ]
}
```

**That's it!** All three fields are optional - just add them to your existing `PUT /api/doctors/me` endpoint.
