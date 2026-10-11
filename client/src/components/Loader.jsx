export default function Loader({ size = 96, label }) {
  return (
    <div className="loader-ct" role="status">
      <i className="loader" style={{ width: size, height: size }} aria-hidden="true"><span /></i>
      {label && <p className="loader-t">{label}</p>}
    </div>
  );
}