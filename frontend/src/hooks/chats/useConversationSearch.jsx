import { useMemo, useState } from "react";

export const useConversationSearch = (conversations, user) => {
    const [searchConversationQuery, setSearchConversationQuery] = useState('');

    const filteredConvos = useMemo(() => {
        if (!conversations || !user) return [];

        if (!searchConversationQuery) return conversations;

        return conversations.filter((convo) => {
            const receiver = convo.users.find((u) => u._id !== user._id);
            return receiver?.name.toLowerCase().includes(searchConversationQuery.toLowerCase());
        });
    }, [searchConversationQuery, conversations, user?._id]);

    return { searchConversationQuery, setSearchConversationQuery, filteredConvos };
};
