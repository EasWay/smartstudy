// Dynamic toast messages for young users
export const ToastMessages = {
    // Success messages for joining groups
    joinSuccess: [
        "🎉 You're in! Welcome to the squad!",
        "✨ Squad up! You joined successfully!",
        "🔥 Boom! You're now part of the crew!",
        "🚀 Welcome aboard! Let's study together!",
        "💪 You're in the gang! Time to level up!",
        "🎯 Mission accomplished! You joined the team!",
        "⚡ Lightning fast! You're now a member!",
        "🌟 Star player added! Welcome to the group!",
        "🎊 Party time! You successfully joined!",
        "🏆 Achievement unlocked: New study buddy!"
    ],

    // Success messages for leaving groups
    leaveSuccess: [
        "👋 See you later! You left the group",
        "✌️ Peace out! Successfully left the squad",
        "🚪 Exit complete! You're out of the group",
        "📤 Mission complete! You left successfully",
        "🎭 Plot twist! You're no longer a member",
        "🌊 Smooth sailing! You left the group",
        "🎪 Show's over! You exited the group",
        "🚀 Blast off! You left the study crew",
        "🎨 New chapter! You left the group",
        "⭐ Freedom! You're out of the squad"
    ],

    // Error messages for joining
    joinError: [
        "😅 Oops! Couldn't join the squad right now",
        "🤔 Hmm... Something went wrong joining",
        "😬 Yikes! Join attempt failed, try again",
        "🚫 Nope! Couldn't get you in this time",
        "💔 Aw snap! Join failed, but don't give up",
        "🔄 Plot twist! Join didn't work, retry?",
        "⚠️ Houston, we have a problem joining",
        "🎭 Drama! Join failed, but you got this",
        "🌪️ Whoops! Join got twisted, try again",
        "🎯 Miss! Couldn't join, but aim again"
    ],

    // Error messages for leaving
    leaveError: [
        "😅 Oops! Couldn't leave right now, try again",
        "🤷‍♀️ Hmm... Leave attempt got stuck",
        "😬 Yikes! Exit door seems jammed",
        "🚫 Nope! Couldn't process your exit",
        "💔 Aw snap! Leave failed, but hang tight",
        "🔄 Plot twist! Exit didn't work out",
        "⚠️ Houston, we have an exit problem",
        "🎭 Drama! Leave failed, but try again",
        "🌪️ Whoops! Exit got twisted somehow",
        "🎯 Miss! Couldn't leave, but aim again"
    ],

    // Info messages for group details
    groupInfo: [
        "📚 Study squad details incoming!",
        "🎓 Here's the tea on this group!",
        "💡 Quick facts about this crew!",
        "🔍 Zoom in on this study gang!",
        "📊 The 411 on this group!",
        "🎯 Target acquired: Group info!",
        "⚡ Lightning round: Group details!",
        "🌟 Spotlight on this study crew!",
        "🎪 Step right up! Group info here!",
        "🚀 Launching group details!"
    ],

    // General error messages
    generalError: [
        "😅 Oops! Something went sideways",
        "🤔 Hmm... That didn't work as planned",
        "😬 Yikes! Technical difficulties ahead",
        "🚫 Nope! System said 'not today'",
        "💔 Aw snap! Something broke",
        "🔄 Plot twist! Try that again",
        "⚠️ Houston, we have a problem",
        "🎭 Drama! But we'll fix this",
        "🌪️ Whoops! Things got messy",
        "🎯 Miss! But you'll hit next time"
    ],

    // Loading/waiting messages
    loading: [
        "⏳ Hold up! Magic is happening...",
        "🔄 Loading... Please vibe with us",
        "⚡ Charging up! Almost there...",
        "🚀 Launching... Prepare for takeoff",
        "🎭 Behind the scenes magic...",
        "🌟 Cooking up something good...",
        "💫 Sprinkling some digital dust...",
        "🎪 Setting up the show...",
        "🔮 Crystal ball is loading...",
        "🎯 Aiming for perfection..."
    ]
};

// Utility function to get random message from array
export const getRandomMessage = (messageArray: string[]): string => {
    const randomIndex = Math.floor(Math.random() * messageArray.length);
    return messageArray[randomIndex];
};

// Specific helper functions for different scenarios
export const getJoinSuccessMessage = () => getRandomMessage(ToastMessages.joinSuccess);
export const getLeaveSuccessMessage = () => getRandomMessage(ToastMessages.leaveSuccess);
export const getJoinErrorMessage = () => getRandomMessage(ToastMessages.joinError);
export const getLeaveErrorMessage = () => getRandomMessage(ToastMessages.leaveError);
export const getGroupInfoMessage = () => getRandomMessage(ToastMessages.groupInfo);
export const getGeneralErrorMessage = () => getRandomMessage(ToastMessages.generalError);
export const getLoadingMessage = () => getRandomMessage(ToastMessages.loading);

// Dynamic message with group context
export const getGroupSpecificMessage = (groupName: string, memberCount: number, maxMembers: number) => {
    const infoMessages = [
        `🎓 ${groupName} squad has ${memberCount}/${maxMembers} members!`,
        `📚 ${groupName} crew is ${memberCount}/${maxMembers} strong!`,
        `🔥 ${groupName} gang: ${memberCount}/${maxMembers} study buddies!`,
        `⚡ ${groupName} team rolling with ${memberCount}/${maxMembers}!`,
        `🌟 ${groupName} squad status: ${memberCount}/${maxMembers} legends!`,
        `🚀 ${groupName} crew flying with ${memberCount}/${maxMembers}!`,
        `💪 ${groupName} gang flexing ${memberCount}/${maxMembers} members!`,
        `🎯 ${groupName} team locked with ${memberCount}/${maxMembers}!`
    ];

    return getRandomMessage(infoMessages);
};