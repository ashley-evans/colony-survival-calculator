import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

function MissingRoute() {
    const { t } = useTranslation();

    return (
        <>
            <p>{t("missing.content")}</p>
            <Link to={"/"}>{t("missing.return")}</Link>
        </>
    );
}

export default MissingRoute;
