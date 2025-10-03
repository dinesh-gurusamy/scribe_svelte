type Field = {
    field_id: number;
    record_id: number;
    field_name: string;
    field_action: 'YES' | 'NO' | null;
}



type RecordItem = {
    record_id: number;
    title: string;
    fields: Field[];
    images: Image[];
}

// type Record = {
//     record_id: number;
//     user_id: string; 
//     title: string | null;
// }

type AdditionalImage = {
    additional_image_id: number;
    parent_image_id: number;
    additional_image_url: string;
    additional_image_number: number | null;
};

type Image = {
    image_id: number;
    image_number: number;
    image_url: string;
    additional_images: AdditionalImage[];
}; // --- PROPS ---
