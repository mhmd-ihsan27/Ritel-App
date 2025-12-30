/**
 * Get category color scheme based on category name
 * This function returns background, text, and border colors for category badges
 *
 * @param {string} kategoriName - The name of the category
 * @returns {object} Object containing bg, text, and border color classes
 */
export const getCategoryColor = (kategoriName) => {
    if (!kategoriName) return {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        name: 'Default'
    };

    const lowerKategori = kategoriName.toLowerCase();

    // Sayuran - Hijau (Green)
    if (lowerKategori.includes('sayur') || lowerKategori.includes('hijau') ||
        lowerKategori.includes('daun') || lowerKategori.includes('kangkung') ||
        lowerKategori.includes('bayam') || lowerKategori.includes('sawi') ||
        lowerKategori.includes('selada') || lowerKategori.includes('brokoli') ||
        lowerKategori.includes('kol') || lowerKategori.includes('kubis')) {
        return {
            bg: 'bg-green-100',
            text: 'text-green-800',
            name: 'Sayuran'
        };
    }

    // Buah - Orange
    if (lowerKategori.includes('buah') || lowerKategori.includes('jeruk') ||
        lowerKategori.includes('apel') || lowerKategori.includes('mangga') ||
        lowerKategori.includes('pisang') || lowerKategori.includes('anggur') ||
        lowerKategori.includes('melon') || lowerKategori.includes('semangka') ||
        lowerKategori.includes('strawberry') || lowerKategori.includes('durian') ||
        lowerKategori.includes('nanas') || lowerKategori.includes('pepaya')) {
        return {
            bg: 'bg-orange-100',
            text: 'text-orange-800',
            name: 'Buah'
        };
    }

    // Umbi - Coklat/Brown (Amber)
    if (lowerKategori.includes('umbi') || lowerKategori.includes('kentang') ||
        lowerKategori.includes('singkong') || lowerKategori.includes('ubi') ||
        lowerKategori.includes('talas') || lowerKategori.includes('wortel')) {
        return {
            bg: 'bg-amber-100',
            text: 'text-amber-800',
            name: 'Umbi-umbian'
        };
    }

    // Bumbu - Merah (Red)
    if (lowerKategori.includes('bumbu') || lowerKategori.includes('rempah') ||
        lowerKategori.includes('cabai') || lowerKategori.includes('bawang') ||
        lowerKategori.includes('jahe') || lowerKategori.includes('lengkuas') ||
        lowerKategori.includes('kunyit') || lowerKategori.includes('merica') ||
        lowerKategori.includes('kemiri') || lowerKategori.includes('cengkeh')) {
        return {
            bg: 'bg-red-100',
            text: 'text-red-800',
            name: 'Bumbu Dapur'
        };
    }

    // Jamur - Purple
    if (lowerKategori.includes('jamur')) {
        return {
            bg: 'bg-purple-100',
            text: 'text-purple-800',
            name: 'Jamur'
        };
    }

    // Kacang - Yellow
    if (lowerKategori.includes('kacang') || lowerKategori.includes('polong') ||
        lowerKategori.includes('buncis') || lowerKategori.includes('edamame')) {
        return {
            bg: 'bg-yellow-100',
            text: 'text-yellow-800',
            name: 'Kacang-kacangan'
        };
    }

    // Biji-bijian - Teal
    if (lowerKategori.includes('biji') || lowerKategori.includes('bijian') ||
        lowerKategori.includes('jagung') || lowerKategori.includes('gandum')) {
        return {
            bg: 'bg-teal-100',
            text: 'text-teal-800',
            name: 'Biji-bijian'
        };
    }

    // Herbal - Lime Green
    if (lowerKategori.includes('herbal') || lowerKategori.includes('obat') ||
        lowerKategori.includes('mint') || lowerKategori.includes('basil') ||
        lowerKategori.includes('rosemary') || lowerKategori.includes('thyme')) {
        return {
            bg: 'bg-lime-100',
            text: 'text-lime-800',
            name: 'Herbal'
        };
    }

    // Olahan - Pink
    if (lowerKategori.includes('olahan') || lowerKategori.includes('frozen') ||
        lowerKategori.includes('beku') || lowerKategori.includes('siap')) {
        return {
            bg: 'bg-pink-100',
            text: 'text-pink-800',
            name: 'Produk Olahan'
        };
    }

    // Default - Blue
    return {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        name: 'Lainnya'
    };
};

/**
 * Get all available category color schemes
 * Useful for displaying legend or color picker
 *
 * @returns {array} Array of category color schemes
 */
export const getCategoryColorSchemes = () => {
    return [
        { name: 'Sayuran', bg: 'bg-green-100', text: 'text-green-800', emoji: '🥬' },
        { name: 'Buah', bg: 'bg-orange-100', text: 'text-orange-800', emoji: '🍊' },
        { name: 'Umbi-umbian', bg: 'bg-amber-100', text: 'text-amber-800', emoji: '🥔' },
        { name: 'Bumbu Dapur', bg: 'bg-red-100', text: 'text-red-800', emoji: '🌶️' },
        { name: 'Jamur', bg: 'bg-purple-100', text: 'text-purple-800', emoji: '🍄' },
        { name: 'Kacang-kacangan', bg: 'bg-yellow-100', text: 'text-yellow-800', emoji: '🥜' },
        { name: 'Biji-bijian', bg: 'bg-teal-100', text: 'text-teal-800', emoji: '🌾' },
        { name: 'Herbal', bg: 'bg-lime-100', text: 'text-lime-800', emoji: '🌿' },
        { name: 'Produk Olahan', bg: 'bg-pink-100', text: 'text-pink-800', emoji: '🍱' },
        { name: 'Lainnya', bg: 'bg-blue-100', text: 'text-blue-800', emoji: '📦' }
    ];
};
