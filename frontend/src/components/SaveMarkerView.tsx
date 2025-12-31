import React, { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { CascadeSelect } from 'primereact/cascadeselect';
import { Button } from 'primereact/button';

export interface PropertyType {
    name: string;
    code: string;
    subCategories: { name: string; code: string }[];
}

export interface SelectedPropertyType {
    parent: PropertyType | null;
    code: string | undefined;
}

interface SaveMarkerViewProps {
    onConfirm: (name: string, propertyType: SelectedPropertyType) => void;
    onCancel: () => void;
    defaultName: string;
}

const SaveMarkerView: React.FC<SaveMarkerViewProps> = ({ onConfirm, onCancel, defaultName }) => {
    const [name, setName] = useState(defaultName);
    const [propertyType, setPropertyType] = useState<{ name: string; code: string } | null>(null);

    const propertyTypes: PropertyType[] = [
        {
            name: 'Development',
            code: 'development',
            subCategories: [
                { name: 'Acquisition', code: 'acquisition' },
                { name: 'Pre-development', code: 'pre-development' },
                { name: 'Construction', code: 'construction' },
                { name: 'Completed', code: 'completed' },
            ],
        },
        {
            name: 'Government/School',
            code: 'gov-school',
            subCategories: [
                { name: 'Public', code: 'public' },
                { name: 'Private', code: 'private' },
                { name: 'Community', code: 'community' },
            ],
        },
    ];

    const handleConfirm = () => {
        let parent: PropertyType | null = null;
        if (propertyType) {
            for (const type of propertyTypes) {
                if (type.subCategories.some(sub => sub.code === propertyType.code)) {
                    parent = type;
                    break;
                }
            }
        }
        onConfirm(name, { parent, code: propertyType?.code });
    };

    return (
        <div>
            <div className="p-field">
                <label htmlFor="name">Name:</label>
                <InputText id="name" value={name} onChange={(e) => setName(e.target.value)}  style={{marginLeft: '20px'}}/>
            </div>
            <br/>
            <div className="p-field">
                <label htmlFor="propertyType">Property Type:</label>
                <CascadeSelect id="propertyType" value={propertyType} options={propertyTypes}
                    optionLabel="name" optionGroupLabel="name" optionGroupChildren={['subCategories']}
                    style={{minWidth: '14rem', marginLeft: '20px'}} placeholder={"Select a Property Type"}
                    onChange={(e) => setPropertyType(e.value)} />
            </div>
            <br/>
            <div className="p-d-flex p-jc-end">
                <Button label="Cancel" icon="pi pi-times" onClick={onCancel} className="p-button-text" style={{ marginRight: '8px', background: '#7C0A02', color: 'white' }} />
                <Button label="Save" icon="pi pi-check" onClick={handleConfirm} disabled={!name || !propertyType} style={{ background: '#276221', color: 'white' }} />
            </div>
        </div>
    );
};

export default SaveMarkerView;


