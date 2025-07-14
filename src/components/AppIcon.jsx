import * as LucideIcons from 'lucide-react';
import { HelpCircle } from 'lucide-react';
import PropTypes from 'prop-types';

function Icon({
  name,
  size = 24,
  color = 'currentColor',
  className = '',
  strokeWidth = 2,
  ...props
}) {
  const IconComponent = LucideIcons[name];

  if (!IconComponent) {
    return (
      <HelpCircle
        size={size}
        color="gray"
        strokeWidth={strokeWidth}
        className={className}
        {...props}
      />
    );
  }

  return (
    <IconComponent
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={className}
      {...props}
    />
  );
}

Icon.propTypes = {
  name: PropTypes.string.isRequired,
  size: PropTypes.number,
  color: PropTypes.string,
  className: PropTypes.string,
  strokeWidth: PropTypes.number
};

export default Icon;
