import { useState, useMemo, useCallback } from 'react';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';
import './TimelineSlider.css';

const TimelineSlider = ({
  config,
  value,
  onChange,
  onMilestoneClick
}) => {
  const {
    minDate = '2024-01-01',
    maxDate = '2024-12-31',
    milestones = [],
    defaultDate
  } = config || {};

  const [isDragging, setIsDragging] = useState(false);
  const [hoverPosition, setHoverPosition] = useState(null);
  const [localPosition, setLocalPosition] = useState(null);

  const dateToPosition = useCallback((date) => {
    const min = parseISO(minDate);
    const max = parseISO(maxDate);
    const current = parseISO(date);

    const totalDays = differenceInDays(max, min);
    const currentDays = differenceInDays(current, min);

    return (currentDays / totalDays) * 100;
  }, [minDate, maxDate]);

  const positionToDate = useCallback((position) => {
    const min = parseISO(minDate);
    const max = parseISO(maxDate);

    const totalDays = differenceInDays(max, min);
    const days = Math.round((position / 100) * totalDays);

    return format(addDays(min, days), 'yyyy-MM-dd');
  }, [minDate, maxDate]);

  const position = useMemo(() => {
    return value ? dateToPosition(value) : dateToPosition(defaultDate || minDate);
  }, [value, defaultDate, dateToPosition]);

  const handleChange = (e) => {
    const newPosition = parseFloat(e.target.value);
    setLocalPosition(newPosition);
    const newDate = positionToDate(newPosition);
    onChange(newDate);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setLocalPosition(null);
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setHoverPosition(Math.max(0, Math.min(100, percentage)));
  };

  const nearestMilestone = useMemo(() => {
    if (!hoverPosition) return null;

    const milestonesWithPositions = milestones.map(m => ({
      ...m,
      position: dateToPosition(m.date)
    }));

    return milestonesWithPositions.reduce((nearest, milestone) => {
      const distance = Math.abs(milestone.position - hoverPosition);
      if (!nearest || distance < nearest.distance) {
        return { ...milestone, distance };
      }
      return nearest;
    }, null);
  }, [hoverPosition, milestones, dateToPosition]);

  return (
    <div className="timeline-slider-container">
      {milestones.length > 0 && (
        <div className="milestone-labels">
          {milestones.map((milestone, index) => {
            const position = dateToPosition(milestone.date);
            return (
              <button
                key={index}
                className={`milestone-label ${milestone.highlighted ? 'highlighted' : ''} ${
                  position >= (value ? dateToPosition(value) : 0) ? 'passed' : ''
                }`}
                style={{ left: `${position}%` }}
                onClick={() => {
                  onMilestoneClick?.(milestone);
                  onChange(format(parseISO(milestone.date), 'yyyy-MM-dd'));
                }}
              >
                <div className="milestone-date">
                  {format(parseISO(milestone.date), 'MMM d, yyyy')}
                </div>
                <div className="milestone-name">{milestone.label}</div>
              </button>
            );
          })}
        </div>
      )}

      <div
        className="slider-track-wrapper"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverPosition(null)}
      >
        <div
          className="slider-progress"
          style={{ width: `${localPosition !== null ? localPosition : position}%` }}
        />

        {milestones.map((milestone, index) => {
          const milestonePos = dateToPosition(milestone.date);
          return (
            <div
              key={index}
              className={`milestone-marker ${milestone.highlighted ? 'highlighted' : ''}`}
              style={{ left: `${milestonePos}%` }}
            />
          );
        })}

        {hoverPosition !== null && (
          <div
            className="hover-preview"
            style={{ left: `${hoverPosition}%` }}
          >
            <span className="preview-date">
              {format(parseISO(positionToDate(hoverPosition)), 'MMM d, yyyy')}
            </span>
          </div>
        )}

        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={localPosition !== null ? localPosition : position}
          onInput={handleChange}
          onChange={handleChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={handleDragEnd}
          onMouseLeave={isDragging ? handleDragEnd : undefined}
          onTouchEnd={handleDragEnd}
          className={`timeline-slider ${isDragging ? 'dragging' : ''}`}
          aria-label="Select timeline date"
          aria-valuetext={value ? format(parseISO(value), 'MMMM d, yyyy') : ''}
        />
      </div>

      <div className="current-date-display">
        <span className="label">Viewing data from:</span>
        <span className="date">
          {value ? format(parseISO(value), 'MMMM d, yyyy') : format(parseISO(defaultDate || minDate), 'MMMM d, yyyy')}
        </span>
      </div>
    </div>
  );
};

export default TimelineSlider;
