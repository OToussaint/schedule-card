# Schedule Card 📅

A visual and intuitive Home Assistant Lovelace card to display your
`schedule` entities as a weekly calendar grid.

![Card](https://github.com/OToussaint/schedule-card/raw/main/screenshots/card.png?cachebuster=123)

## Features

-   **Weekly Calendar View**: Display your Home Assistant schedules in a
    clear Google Calendar-like grid
-   **Automatic Time Range**: The visible timeline adapts to your
    configured schedule intervals
-   **Current Time Indicator**: Shows the current time with a live red
    marker
-   **Localized Display**:
    -   Uses Home Assistant language settings
    -   Automatically formats times according to 12h/24h preference
    -   Uses the configured first day of week
-   **Visual Day Highlighting**:
    -   Highlights the current day
    -   Highlights active schedule blocks
-   **Responsive Design**: Works on desktop and mobile dashboards
-   **Native HA Styling**:
    -   Uses Home Assistant theme variables
    -   Supports dark/light themes
-   **Visual Editor Support**: Configure the card directly from the
    Lovelace UI

## Installation

### Using HACS (Recommended) ⭐

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=OToussaint&repository=schedule-card&category=plugin)


1.  Open **HACS** in Home Assistant
2.  Go to **Frontend**
3.  Search for **"Schedule Card"**
4.  Click **Install**
5.  Reload your browser

### Manual Installation

1.  Copy the JavaScript file:

```{=html}
<!-- -->
```
    .homeassistant/www/schedule-card/
    └── schedule-card.js

2.  Add the resource in your Lovelace dashboard:

``` yaml
resources:
  - url: /local/schedule-card/schedule-card.js
    type: module
```

3.  Refresh Home Assistant

## Adding to Your Dashboard

In Lovelace edit mode, search for:

**Schedule Card**

or add manually:

``` yaml
type: custom:schedule-card
entity: schedule.my_schedule
```

## Configuration

### Required

-   **entity**: A Home Assistant `schedule` entity

### Optional

-   **title**: Display a custom card title

## Examples

### Basic setup

``` yaml
type: custom:schedule-card
entity: schedule.house_routine
```

### With title

``` yaml
type: custom:schedule-card
entity: schedule.work_schedule
title: Weekly Planning
```

## Supported Entities

This card supports Home Assistant schedule entities:

-   Work schedules
-   Heating schedules
-   Presence schedules
-   Automation schedules
-   Any custom `schedule.*` entity

## Troubleshooting

### Card says "Entity not found"

-   Check that the entity ID exists
-   Verify the entity domain is `schedule`
-   Check Developer Tools → States

### Card shows "Failed to parse service response"

-   Make sure your Home Assistant version supports schedule service
    responses
-   Reload Home Assistant

### No visual editor appears

-   Ensure the latest JavaScript resource is loaded
-   Clear browser cache
-   Restart Home Assistant frontend

## Tips & Tricks

-   Use multiple cards for different schedules
-   Combine with automations based on the same schedule entity
-   Use dashboard sections to create clean weekly planning views
-   Let the visual editor generate your YAML automatically

## Support

If you encounter issues:

1.  Check browser console (F12)
2.  Verify your schedule entity works correctly
3.  Reload frontend resources
4.  Open an issue with:
    -   Home Assistant version
    -   Browser information
    -   Console errors
    -   Card configuration
