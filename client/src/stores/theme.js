import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useThemeStore = defineStore('theme', () => {
    const themeOptions = ref([]);
    const selectedTheme = ref(null);

    const setThemeOptions = (themes) => {
        themeOptions.value = themes;
    }

    const setSelectedTheme = (theme) => {
        selectedTheme.value = theme;
    };

    const clearThemes = () => {
        themeOptions.value = [];
        selectedTheme.value = null;
    };

    return {
        themeOptions,
        selectedTheme,
        setThemeOptions,
        setSelectedTheme,
        clearThemes
    };
});
