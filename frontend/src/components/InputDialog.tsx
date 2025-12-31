import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';

interface InputDialogProps {
  visible: boolean;
  title: string;
  placeholder: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

const InputDialog: React.FC<InputDialogProps> = ({
  visible,
  title,
  placeholder,
  defaultValue = '',
  onConfirm,
  onCancel
}) => {
  const [inputValue, setInputValue] = useState(defaultValue);

  useEffect(() => {
    setInputValue(defaultValue);
  }, [defaultValue, visible]);

  const handleConfirm = () => {
    if (inputValue.trim()) {
      onConfirm(inputValue.trim());
      setInputValue('');
    }
  };

  const handleCancel = () => {
    onCancel();
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    }
  };

  const footerContent = (
    <div>
      <Button 
        label="Cancel" 
        icon="pi pi-times" 
        onClick={handleCancel} 
        className="p-button-text" 
        style={{ marginRight: '8px', background: '#7C0A02', color: 'white' }}
      />
      <Button 
        label="Confirm" 
        icon="pi pi-check" 
        onClick={handleConfirm} 
        disabled={!inputValue.trim()}
        autoFocus
        style={{ background: '#276221', color: 'white' }}
      />
    </div>
  );

  return (
    <Dialog
      header={title}
      visible={visible}
      style={{ width: '400px' }}
      footer={footerContent}
      onHide={handleCancel}
      modal
      draggable={false}
      resizable={false}
    >
      <div style={{ marginBottom: '1rem' }}>
        <InputText
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={{ width: '100%' }}
          autoFocus
        />
      </div>
    </Dialog>
  );
};

export default InputDialog;