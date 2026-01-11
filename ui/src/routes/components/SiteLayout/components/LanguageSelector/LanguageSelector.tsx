import { useSelect } from "downshift";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLanguage } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { Container, LanguageButton, Dropdown, LanguageOption } from "./styles";
import { SUPPORTED_LANGUAGES } from "../../../../../i18n";

function LanguageSelector() {
    const { t, i18n } = useTranslation();

    const currentLanguage =
        SUPPORTED_LANGUAGES.find((lang) => lang.code === i18n.language) ??
        SUPPORTED_LANGUAGES[0];

    const {
        isOpen,
        selectedItem,
        getToggleButtonProps,
        getMenuProps,
        getItemProps,
        highlightedIndex,
    } = useSelect({
        items: SUPPORTED_LANGUAGES,
        selectedItem: currentLanguage,
        onSelectedItemChange: ({ selectedItem }) => {
            if (selectedItem) {
                i18n.changeLanguage(selectedItem.code);
            }
        },
    });

    return (
        <Container>
            <LanguageButton
                {...getToggleButtonProps()}
                aria-label={t("layout.icons.changeLanguage")}
            >
                <FontAwesomeIcon icon={faLanguage} size="2x" />
            </LanguageButton>
            <Dropdown {...getMenuProps()} $isOpen={isOpen}>
                {isOpen &&
                    SUPPORTED_LANGUAGES.map((lang, index) => (
                        <LanguageOption
                            key={lang.code}
                            {...getItemProps({ item: lang, index })}
                            $isActive={selectedItem?.code === lang.code}
                            $isHighlighted={highlightedIndex === index}
                        >
                            {lang.label}
                        </LanguageOption>
                    ))}
            </Dropdown>
        </Container>
    );
}

export { LanguageSelector };
