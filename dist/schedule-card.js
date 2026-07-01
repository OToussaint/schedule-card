import {
  LitElement,
  html,
  css,
} from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

class ScheduleCard extends LitElement {
  static get properties() {
    return {
      hass: {},
      config: {},
      _scheduleData: { type: Object },
      _error: { type: String },
      _currentTime: { type: Object }
    };
  }

  static getConfigElement() {
    return document.createElement("schedule-card-editor");
  }

  constructor() {
    super();
    this._scheduleData = null;
    this._error = null;
    this._lastEntity = null;
    this._currentTime = new Date();
    this._timer = null;
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error("You must define an entity");
    }
    this.config = config;
  }

  connectedCallback() {
    super.connectedCallback();
    // Update the time immediately and then every 5 minutes (300,000 ms) to save resources
    this._currentTime = new Date();
    this._timer = setInterval(() => {
      this._currentTime = new Date();
    }, 300000);
  }

  disconnectedCallback() {
    if (this._timer) {
      clearInterval(this._timer);
    }
    super.disconnectedCallback();
  }

  updated(changedProperties) {
    super.updated(changedProperties);
    
    if (this.hass && this.config && (changedProperties.has("hass") || changedProperties.has("config"))) {
      const currentEntity = this.config.entity;
      if (currentEntity !== this._lastEntity) {
        this._lastEntity = currentEntity;
        this._fetchScheduleData();
      }
    }
  }

  async _fetchScheduleData() {
    if (!this.hass || !this.config.entity) return;

    try {
      const response = await this.hass.callWS({
        type: "call_service",
        domain: "schedule",
        service: "get_schedule",
        target: {
          entity_id: this.config.entity
        },
        return_response: true
      });

      if (response && response.response) {
        const entityData = response.response[this.config.entity];
        if (entityData) {
          this._scheduleData = entityData;
          this._error = null;
        } else {
          this._error = `No schedule data returned for ${this.config.entity}`;
        }
      } else {
        this._error = "Failed to parse service response";
      }
    } catch (err) {
      this._error = `Error fetching schedule: ${err.message || err}`;
      console.error("Schedule Card Error:", err);
    }
  }

  _timeToDecimal(timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours + minutes / 60;
  }

  _formatHour(hour) {
    const date = new Date();
    date.setHours(hour, 0, 0);
    
    // Adapt format based on HA user settings (12h/24h)
    const options = {
      hour: "numeric",
      minute: "2-digit",
      hour12: this.hass.locale.time_format === "12"
    };

    return new Intl.DateTimeFormat(this.hass.language, options).format(date);
  }
  
  // Method to format event times based on user's locale (e.g., "16:30" -> "4:30 PM")
  _formatEventTime(timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0);
    
    const options = {
      hour: "numeric",
      minute: "2-digit",
      hour12: this.hass.locale.time_format === "12"
    };

    return new Intl.DateTimeFormat(this.hass.language, options).format(date);
  }

  _getOrderedDays() {
    // Standard keys
    const dayKeys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    
    // Generate localized day labels dynamically via Intl
    const allDays = dayKeys.map((key, index) => {
      const date = new Date(2026, 2, 1 + index); // March 1st 2026 = Sunday
      const label = new Intl.DateTimeFormat(this.hass.language, { weekday: "short" })
        .format(date)
        .toUpperCase()
        .replace(".", "");
      return { key, label };
    });

    // Determine the start day of the week
    let firstDayKey = "monday";
    if (this.hass?.locale?.first_weekday && this.hass.locale.first_weekday !== "language") {
      firstDayKey = this.hass.locale.first_weekday;
    } else if (this.hass?.language && !this.hass.language.startsWith("en")) {
      firstDayKey = "monday";
    }

    const startIndex = allDays.findIndex(d => d.key === firstDayKey);
    return [
      ...allDays.slice(startIndex),
      ...allDays.slice(0, startIndex)
    ];
  }

  _showMoreInfo() {
    const event = new CustomEvent("hass-more-info", {
      bubbles: true,
      composed: true,
      detail: { entityId: this.config.entity },
    });
    this.dispatchEvent(event);
  }

  _navigateToEdit() {
    const event = new CustomEvent("hass-dialog", {
      bubbles: true,
      composed: true,
      detail: {
        dialogClosedCallback: () => {},
        dialogParams: {
          entityId: this.config.entity,
        },
        dialogTag: "entity-config-dialog", // C'est le tag interne pour l'éditeur
      },
    });
    this.dispatchEvent(event);
  }

_calculateHourRange(days) {
    let minHour = 8;
    let maxHour = 17;
    let hasIntervals = false;

    let absoluteMin = 24;
    let absoluteMax = 0;

    days.forEach(d => {
      const intervals = this._scheduleData[d.key] || [];
      intervals.forEach(interval => {
        if (interval.from && interval.to) {
          hasIntervals = true;
          const startDec = this._timeToDecimal(interval.from);
          const endDec = this._timeToDecimal(interval.to);

          if (startDec < absoluteMin) {
            absoluteMin = startDec;
          }
          if (endDec > absoluteMax) {
            absoluteMax = endDec;
          }
        }
      });
    });

    if (hasIntervals) {
      minHour = Math.floor(absoluteMin);
      maxHour = Math.ceil(absoluteMax);
    }

    minHour = Math.max(0, minHour);
    maxHour = Math.min(24, maxHour);

    return { start: minHour, end: maxHour };
  }

  render() {
    if (!this.hass || !this.config) {
      return html``;
    }

    if (this._error) {
      return html`
        <ha-card class="error-card">
          <div class="error-message">${this._error}</div>
        </ha-card>
      `;
    }

    if (!this._scheduleData) {
      return html`
        <ha-card class="loading-card">
          <div class="loading-message">Loading schedule data...</div>
        </ha-card>
      `;
    }

    // Get days ordered based on locale / language settings
    const days = this._getOrderedDays();

    const { start: startHour, end: endHour } = this._calculateHourRange(days);

    const hours = [];
    for (let h = startHour; h < endHour; h++) {
      hours.push(h);
    }

    const currentDayIndex = new Date().getDay();
    const dayKeysOrder = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const currentDayKey = dayKeysOrder[currentDayIndex];

    // Calculate current time line position
    const currentHourDec = this._currentTime.getHours() + this._currentTime.getMinutes() / 60;
    const showTimeLineInRange = currentHourDec >= startHour && currentHourDec < endHour;
    const showTimeLineEnabled = this.config && (this.config.show_current_time === undefined ? true : Boolean(this.config.show_current_time));
    const showTimeLine = showTimeLineInRange && showTimeLineEnabled;
    const highlightActive = this.config && (this.config.highlight_active_block === undefined ? true : Boolean(this.config.highlight_active_block));
    const timeLineTopPercent = showTimeLine ? ((currentHourDec - startHour) / (endHour - startHour)) * 100 : 0;

    return html`
      <ha-card>
        <div class="schedule-container" style="--hour-count: ${hours.length};">
          ${this.config.title ? html`<div class="card-title">${this.config.title}</div>` : ''}
          
          <!-- Grid Days Header Row -->
          <div class="grid-header">
            <div class="time-header-cell"></div>
            ${days.map(d => html`
              <div class="day-header-cell ${d.key === currentDayKey ? 'current-day' : ''}">
                ${d.label}
              </div>
            `)}
          </div>

          <!-- Main Grid Structure -->
          <div class="grid-body">
            
            <!-- Left hours column (Skipping the very first limit at 0% top) -->
            <div class="time-column">
              ${hours.map((h, index) => {
                if (index === 0) return html``;
                return html`
                  <div class="time-cell" style="top: ${(index / hours.length) * 100}%;">
                    <span>${this._formatHour(h)}</span>
                  </div>
                `;
              })}
            </div>

            <!-- Content columns for each day -->
            <div class="days-columns-container">
              <!-- Realtime Indicator Line (Google Calendar style) -->
              ${showTimeLine ? html`
                <div class="current-time-line" style="top: ${timeLineTopPercent}%;"></div>
              ` : html``}

              ${days.map(d => {
                const intervals = this._scheduleData[d.key] || [];
                const isCurrent = d.key === currentDayKey;

                return html`
                  <div class="day-column ${isCurrent ? 'current-day-column' : ''}">
                    <!-- Background Grid Rows (using explicit class for last line) -->
                    ${hours.map((_, index) => html`
                      <div class="grid-row-line ${index === hours.length - 1 ? 'last-line' : ''}"></div>
                    `)}

                    <!-- Event Blocks Rendering -->
                    ${intervals.map(interval => {
                      const startDec = this._timeToDecimal(interval.from);
                      const endDec = this._timeToDecimal(interval.to);

                      // Filter out events that are completely out of bounds
                      if (startDec >= endHour || endDec <= startHour) return html``;

                      // Limit positions to visible container bounds
                      const visibleStart = Math.max(startDec, startHour);
                      const visibleEnd = Math.min(endDec, endHour);

                      // Calculate absolute coordinates in percentages
                      const top = ((visibleStart - startHour) / (endHour - startHour)) * 100;
                      const height = ((visibleEnd - visibleStart) / (endHour - startHour)) * 100;

                      // Extract and format time strings (HH:MM)
                      const displayFrom = interval.from.substring(0, 5);
                      const displayTo = interval.to.substring(0, 5);

                      return html`
                          <div 
                            class="event-block ${isCurrent && this.hass.states[this.config.entity]?.state !== 'off' && highlightActive ? 'current-event' : ''}" 
                            style="top: ${top}%; height: ${height}%;" 
                            @click="${() => this._showMoreInfo()}"
                          >
                          <div class="event-text">${this._formatEventTime(interval.from)}&nbsp;-</div>
                          <div class="event-text">${this._formatEventTime(interval.to)}</div>
                        </div>
                      `;
                    })}
                  </div>
                `;
              })}
            </div>

          </div>

        </div>
      </ha-card>
    `;
  }

  static get styles() {
    return css`
      :host {
        --grid-border-color: var(--divider-color, #e5e7eb);
        --grid-line-color: var(--secondary-background-color, #f1f5f9);
        --cell-height: 30px;
        --time-column-width: 55px; /* Increased from 55px to accommodate "12:00 PM" */
        --time-indicator-color: var(--error-color, #ea4335); /* Google Red or HA Error */
        
        /* Dynamic theme colors using CSS color-mix */
        --highlight-bg: color-mix(
          in srgb, 
          var(--accent-color, #ff9800) 10%, 
          var(--primary-background-color, var(--card-background-color, #ffffff))
        );

        --highlight-header-bg: color-mix(
          in srgb, 
          var(--accent-color, #ff9800) 20%, 
          var(--primary-background-color, var(--card-background-color, #ffffff))
        );
        
        // /* 30% more background (70% primary, 30% background) on normal days */
        // --event-color: color-mix(
        //   in srgb,
        //   var(--primary-color, #009ac7) 70%,
        //   var(--primary-background-color, var(--card-background-color, #ffffff)) 30%
        // );

        --event-color: var(--primary-color, #009ac7);

        /* 100% accent-color on the current day */
        --current-event-color: var(--accent-color, #ff9800);
      }

      .card-title {
        font-family: var(--ha-font-family-body, sans-serif);
        font-size: var(--ha-font-size-xl, 24px);
        font-weight: var(--ha-font-weight-normal, 400);
        margin-bottom: 8px;
        color: var(--primary-text-color);
      }

      .error-card {
        padding: 16px;
        color: var(--error-color, #ef4444);
        background-color: var(--card-background-color, #fff);
      }
      .error-message {
        font-family: monospace;
        font-size: 0.9em;
      }
      .loading-card {
        padding: 16px;
        color: var(--secondary-text-color, #64748b);
      }
      .loading-message {
        font-family: sans-serif;
        font-size: 0.9em;
      }

      .schedule-container {
        padding: 16px;
        background-color: var(--card-background-color, #ffffff);
        border-radius: var(--ha-card-border-radius, 12px);
        overflow: hidden;
      }

      /* Days Header Setup */
      .grid-header {
        display: grid;
        grid-template-columns: var(--time-column-width) repeat(7, 1fr);
        text-align: center;
        border: 1px solid var(--grid-border-color);
        border-bottom: none;
        background-color: var(--secondary-background-color, #f8fafc);
        font-size: 0.75em;
        font-weight: 700;
        color: var(--secondary-text-color, #475569);
        border-top-left-radius: 4px;
        border-top-right-radius: 4px;
        z-index: 1;
      }
      .time-header-cell {
        border-right: 1px solid var(--grid-border-color);
      }
      .day-header-cell {
        padding: 6px 0;
        border-right: 1px solid var(--grid-border-color);
      }
      .day-header-cell:last-child {
        border-right: none;
      }
      .day-header-cell.current-day {
        background-color: var(--highlight-header-bg);
        color: var(--primary-text-color);
      }

      /* Main Grid Structure */
      .grid-body {
        display: grid;
        grid-template-columns: var(--time-column-width) repeat(7, 1fr);
        border: 1px solid var(--grid-border-color);
        background-color: var(--card-background-color, #ffffff);
        border-bottom-left-radius: 4px;
        border-bottom-right-radius: 4px;
        /* Lock natural height but allow flexible scaling within custom card bounds */
        height: calc(var(--cell-height) * var(--hour-count, 9));
        overflow: hidden;
      }

      /* Left hours column styling - using absolute positioning to center on grid lines */
      .time-column {
        position: relative;
        height: 100%;
        border-right: 1px solid var(--grid-border-color);
        background-color: var(--secondary-background-color, #f8fafc);
        overflow: visible;
        z-index: 2;
      }
      .time-cell {
        position: absolute;
        left: 0;
        right: 0;
        transform: translateY(-50%);
        display: flex;
        justify-content: center;
        font-size: 0.75em;
        font-weight: 500;
        color: var(--secondary-text-color, #64748b);
        box-sizing: border-box;
        z-index: 3;
      }

      /* Days Columns Grid Container */
      .days-columns-container {
        grid-column: 2 / span 7;
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        position: relative;
        height: 100%;
        overflow: visible;
      }

      /* Columns share same flexible height */
      .day-column {
        position: relative;
        height: 100%;
        display: flex;
        flex-direction: column;
        border-right: 1px solid var(--grid-border-color);
        box-sizing: border-box;
      }
      .day-column:last-child {
        border-right: none;
      }
      .day-column.current-day-column {
        background-color: var(--highlight-bg);
      }

      /* Grid horizontal row lines - flex: 1 makes them perfectly proportional to hour percentages */
      .grid-row-line {
        flex: 1;
        border-bottom: 1px dashed var(--grid-line-color);
        box-sizing: border-box;
      }
      .grid-row-line.last-line {
        border-bottom: none;
      }

      /* Event Block Styling */
      .event-block {
        position: absolute;
        left: 4px;
        right: 4px;
        background-color: var(--event-color);
        color: #ffffff;
        border-radius: 6px;
        padding: 6px 4px;
        font-size: 0.75em;
        font-weight: 600;
        display: flex;
        flex-direction: column;
        gap: 1px;
        overflow: hidden;
        cursor: pointer;
        z-index: 1;
        box-sizing: border-box;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
        overflow: hidden
      }
      
      /* Style specific to the current day column event blocks */
      .current-day-column .event-block.current-event {
        background-color: var(--current-event-color);
      }

      .event-text {
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
      }

      /* Google Calendar-like Current Time Indicator Line */
      .current-time-line {
        position: absolute;
        left: 0;
        right: 0;
        border-top: 2px solid var(--time-indicator-color);
        z-index: 3;
        pointer-events: none; /* Allows click-throughs */
        overflow: visible;
      }
      /* Circle on the far-left edge of the indicator line */
      .current-time-line::before {
        content: "";
        position: absolute;
        left: -3px;
        top: -4px;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: var(--time-indicator-color);
        z-index: 3;
      }
    `;
  }
}

customElements.define("schedule-card", ScheduleCard);

class ScheduleCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  set hass(hass) {
    this._hass = hass;
    if (this._form) {
      this._form.hass = hass;
    }
  }

  setConfig(config) {
    this._config = config;
    this._render();
  }

  _render() {
    if (!this._config) return;

    const SCHEMA = [
      {
        name: "entity",
        required: true,
        selector: {
          entity: {
            domain: "schedule",
          },
        },
      },
      {
        name: "title",
        selector: {
          text: {},
        },
      },
      {
        name: "show_current_time",
        selector: {
          boolean: {},
        },
      },
      {
        name: "highlight_active_block",
        selector: {
          boolean: {},
        },
      },
    ];

    const formData = {
      entity: this._config.entity || "",
      title: this._config.title || "",
      show_current_time: this._config.show_current_time === undefined ? true : this._config.show_current_time,
      highlight_active_block: this._config.highlight_active_block === undefined ? true : this._config.highlight_active_block,
    };

    if (!this._form) {
      this.shadowRoot.innerHTML = `<ha-form id="form"></ha-form>`;
      this._form = this.shadowRoot.getElementById("form");
      this._form.addEventListener("value-changed", (ev) => this._valueChanged(ev));
    }

    this._form.hass = this._hass;
    this._form.data = formData;
    this._form.schema = SCHEMA;

  }

  _valueChanged(ev) {
    const formData = ev.detail.value;

    /* Build config object to send back to Lovelace */
    const config = {
      type: this._config.type || "custom:schedule-card",
      entity: formData.entity,
    };

    /* Only include title in config if user entered one (cleaner YAML) */
    if (formData.title && formData.title !== '') {
      config.title = formData.title;
    }

    /* Only include show_current_time when user disables it (default is true) */
    if (formData.show_current_time === false) {
      config.show_current_time = false;
    }
    /* Only include highlight_active_block when user disables it (default is true) */
    if (formData.highlight_active_block === false) {
      config.highlight_active_block = false;
    }

    /* Dispatch custom event so Lovelace knows to save new config */
    const event = new CustomEvent(
      "config-changed",
      {
        detail: { config },
        bubbles: true,          // Propagate up DOM tree
        composed: true          // Cross shadow DOM boundary
      }
    );

    this.dispatchEvent(event);
  }
}

customElements.define("schedule-card-editor", ScheduleCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "schedule-card",
  name: "Schedule Card",
  preview: true,
  description: "Visualise Home Assistant schedules in a grid format.",
});