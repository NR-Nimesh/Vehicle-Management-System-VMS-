import React, { forwardRef } from 'react';

/**
 * Input wrapper that keeps decorative icons from overlapping typed text.
 * Icons are pointer-events-none; optional right slot for clear buttons etc.
 */
const InputWithIcon = forwardRef(function InputWithIcon({
  icon: Icon,
  iconSize = 16,
  rightSlot = null,
  wrapperClassName = '',
  className = '',
  type = 'text',
  ...inputProps
}, ref) {
  const hasLeftIcon = Boolean(Icon);
  const hasRightSlot = Boolean(rightSlot);

  const inputClasses = [
    'glass-input w-full',
    hasLeftIcon && 'glass-input-icon-left',
    hasRightSlot && 'glass-input-icon-right',
    type === 'date' && 'glass-input-date',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`input-icon-wrap ${wrapperClassName}`}>
      {hasLeftIcon && (
        <span className="input-icon-left" aria-hidden="true">
          <Icon size={iconSize} />
        </span>
      )}
      <input ref={ref} type={type} className={inputClasses} {...inputProps} />
      {hasRightSlot && <div className="input-icon-right">{rightSlot}</div>}
    </div>
  );
});

export default InputWithIcon;
