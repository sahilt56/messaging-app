// components/EmojiPicker.js (Simplified and Corrected)
import dynamic from 'next/dynamic';

// Dynamically import the emoji picker to avoid SSR issues.
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

// This component only passes props to the dynamic component.
const EmojiPickerComponent = (props) => {
    // Note: We removed the local state (inputValue) and the local <input> field.
    return <EmojiPicker {...props} />;
};

export default EmojiPickerComponent;