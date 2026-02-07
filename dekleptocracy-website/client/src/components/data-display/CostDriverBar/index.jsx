import './CostDriverBar.css';

/**
 * Cost Driver Bar Component
 * @param {Object} props
 * @param {Object} props.driver - Cost driver data
 */
export function CostDriverBar({ driver }) {
  return (
    <div className="cost-driver-bar">
      <span className="cost-driver-bar__label">{driver.label}</span>
      <div className="cost-driver-bar__container">
        <div
          className="cost-driver-bar__fill"
          style={{
            width: `${driver.percentage}%`,
            backgroundColor: driver.color
          }}
        />
      </div>
      <span className="cost-driver-bar__percentage">{driver.percentage}%</span>
    </div>
  );
}

/**
 * Cost Driver List Component
 * @param {Object} props
 * @param {Array} props.drivers - Array of cost drivers
 */
export function CostDriverList({ drivers }) {
  return (
    <div className="cost-driver-list">
      {drivers.map((driver, index) => (
        <CostDriverBar key={index} driver={driver} />
      ))}
    </div>
  );
}

export default CostDriverBar;
