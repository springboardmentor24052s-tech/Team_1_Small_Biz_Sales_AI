import "./PrimaryButton.css";

function PrimaryButton({ text }) {
  return (
    <button className="primary-btn">
      {text}
    </button>
  );
}

export default PrimaryButton;