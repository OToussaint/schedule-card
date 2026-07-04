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

1. Copy the entire `dist` folder content to your Home Assistant config folder:
   ```
   .homeassistant/www/schedue-card/
   ├── schedule-card.js
   └── translations/
       ├── en.json
       ├── fr.json
       └── ...
   ```
   
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

**entity**: <span style="color: #8792a2; text-transform: lowercase;">string</span> <span style="color: #e56f4a; text-transform: uppercase; font-size: 12px;">Required</span>  
A Home Assistant `schedule` entity

**title**: <span style="color: #8792a2; text-transform: lowercase;">string (Optional)</span>  
Display a custom card title
   
**show_current_time**: <span style="color: #8792a2; text-transform: lowercase;">boolean (Optional, default: true)</span>  
Set to `false` to **hide** the live current time indicator (red line with dot).

**state_color**: <span style="color: #8792a2; text-transform: lowercase;">boolean (Optional, default: true)</span>  
Set to `false` to **disable** block coloring when entity is active.

**row_header**: <span style="color: #8792a2; text-transform: lowercase;">string (Optional, default: top)</span>  
Choose how hour labels are positioned in the left column. Possible values:
 - `top` the hour label is aligned with the dashed grid line.
 - `middle` the hour label is centered between two dashed grid lines (middle of the cell). When `middle` is selected, the first and last visible hours are also shown.

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

### With row header in the middle of the cell

``` yaml
type: custom:schedule-card
entity: schedule.house_routine
row_header: middle
```

### Options examples

Disable only the current time indicator:

``` yaml
type: custom:schedule-card
entity: schedule.house_routine
show_current_time: false
```

Disable only the active-block highlighting (disable state color):

``` yaml
type: custom:schedule-card
entity: schedule.house_routine
state_color: false
```

Disable both options:

``` yaml
type: custom:schedule-card
entity: schedule.house_routine
show_current_time: false
state_color: false
```

## Supported Entities

This card supports Home Assistant schedule entities

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

## Customization / Theming

Users can override the card CSS variables (colors, sizes) using `card_mod`.

Common CSS variables you can target:

- `--time-indicator-color` — color of the current time line and dot
- `--grid-line-color` — color of the dashed grid lines
- `--grid-border-color` — border color around the grid
- `--event-color` — background color for event blocks
- `--current-event-color` — background color for active/current events
- `--highlight-bg` — background for the current day column
- `--highlight-header-bg` — background for the day header of the current day
- `--time-column-width` — width of the left time column

Example `card_mod` usage:

```yaml
type: custom:schedule-card
entity: schedule.house_routine
card_mod:
    style: |
        ha-card {
            --time-indicator-color: #1e88e5;
            --grid-line-color: rgba(30,136,229,0.06);
            --event-color: #4caf50;
            --current-event-color: #ff5722;
        }
```

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
