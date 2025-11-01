import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../Button/Button';
import { Card, CardBody, CardFooter, CardHeader } from '../Card/Card';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  footer?: string | React.ReactNode;
  children?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  footer,
}) => {
  const modalRoot = document.body;

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) { return null }

  return createPortal(
    <button
      type="button"
      className="fixed inset-0 z-50 flex items-center justify-center bg-modal-bg/50"
      onClick={onClose}
    >
      <Card
        onClick={(e) => e.stopPropagation()}
        className="max-w-lg w-full shadow-lg"
      >
        {title && <CardHeader>{title}</CardHeader>}

        <CardBody>{children}</CardBody>

        <CardFooter className="flex justify-between items-center">
          {typeof footer === 'string' ? (
            <>
              <div>{footer}</div>
              <Button onClick={onClose}>Close</Button>
            </>
          ) : footer ? (
            <>
              {footer}
              <Button onClick={onClose}>Close</Button>
            </>
          ) : (
            <div className="flex justify-end w-full">
              <Button onClick={onClose}>Close</Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </button >,
    modalRoot
  );
};
