import React, { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
import clsx from 'clsx';

const ItemImage = ({ src, alt, className, rarity }) => {
    const [imgSrc, setImgSrc] = useState(src);
    const [hasError, setHasError] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        setImgSrc(src);
        setHasError(false);
        setRetryCount(0);
    }, [src]);

    const handleError = () => {
        if (retryCount === 0 && (src.includes('/360fx360f') || src.includes('/300fx300f') || src.includes('/330x192'))) {
            // Try removing the dimension suffix to get the raw original image
            // Handles various suffixes we might have used
            let newSrc = src.replace('/360fx360f', '')
                .replace('/300fx300f', '')
                .replace('/330x192', '');
            setImgSrc(newSrc);
            setRetryCount(1);
        } else {
            setHasError(true);
        }
    };

    if (hasError || !src) {
        return (
            <div className={clsx(className, "flex items-center justify-center bg-gray-800/50 rounded-lg")}>
                <Flame
                    size={className?.includes('w-8') ? 16 : 24}
                    className={clsx("opacity-50",
                        rarity === 'Covert' ? "text-red-500" :
                            rarity === 'Classified' ? "text-pink-500" :
                                rarity === 'Restricted' ? "text-purple-500" :
                                    "text-blue-500"
                    )}
                />
            </div>
        );
    }

    return (
        <img
            src={imgSrc}
            alt={alt}
            className={className}
            onError={handleError}
            loading="lazy"
        />
    );
};

export default ItemImage;
