const DeleteConfirmation = ({
  id = "delete-confirmation-modal",
  title,
  content,
  onConfirm,
  isLoading = false,
}) => {
  const handleClose = () => {
    document.getElementById(id)?.close();
  };

  return (
    <dialog id={id} className="modal">
      <div className="modal-box">
        {title && <h3 className="font-bold text-lg mb-4">{title}</h3>}
        <p className="py-4">
          {content
            ? `Are you sure you want to delete ${content}?`
            : "Are you sure you want to delete this item?"}
        </p>
        <div className="modal-action">
          <form method="dialog">
            <button
              type="submit"
              className="btn btn-ghost"
              disabled={isLoading}
            >
              Cancel
            </button>
          </form>
          <button
            onClick={onConfirm}
            className="btn btn-error"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop" onClick={handleClose}>
        <button type="button">close</button>
      </form>
    </dialog>
  );
};

export default DeleteConfirmation;
