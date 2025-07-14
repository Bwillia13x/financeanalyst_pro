import PropTypes from 'prop-types';

function Image({ src, alt = 'Image Name', className = '', ...props }) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={e => {
        e.target.src = '/assets/images/no_image.png';
      }}
      {...props}
    />
  );
}

Image.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string,
  className: PropTypes.string
};

export default Image;
