const DeleteConfirmation = ({ content, onConfirm }) => {
  return (
    <dialog id="delete-confirmation-modal" className="modal">
      <div className="modal-box">
        <p className="py-4">Are you sure you want to delete this {content}?</p>
        <div className="modal-action">
          <form method="dialog">
            <button className="btn btn-secondary w-20">Close</button>
          </form>
          <button onClick={onConfirm} className="btn btn-error w-20">
            Delete
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>Close</button>
      </form>
    </dialog>
  );
};

export default DeleteConfirmation;
