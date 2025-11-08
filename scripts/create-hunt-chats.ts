/**
 * One-time script to create chat groups for existing hunts
 * Run: npx tsx scripts/create-hunt-chats.ts
 */

import { prisma } from "../src/lib/prisma";

async function createHuntChats() {
  console.log("🔍 Finding hunts without chat groups...");

  const huntsWithoutChats = await prisma.hunt.findMany({
    where: {
      chatGroup: null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  console.log(`📊 Found ${huntsWithoutChats.length} hunts without chat groups`);

  if (huntsWithoutChats.length === 0) {
    console.log("✅ All hunts already have chat groups!");
    return;
  }

  for (const hunt of huntsWithoutChats) {
    console.log(`\n🏕️  Creating chat for hunt: "${hunt.name}" (${hunt.id})`);

    try {
      // Create chat group
      const chatGroup = await prisma.chatGroup.create({
        data: {
          name: `${hunt.name} - Hunt Chat`,
          description: `Group chat for ${hunt.name}`,
          groupType: "hunt",
          visibility: "private",
          huntId: hunt.id,
          ownerId: hunt.userId,
          memberCount: 0, // Will be updated as we add members
          countryCode: null,
          countryName: null,
          areaName: null,
        },
      });

      console.log(`   ✅ Chat group created: ${chatGroup.id}`);

      // Find all confirmed participants (including creator)
      const confirmedParticipants = await prisma.huntParticipant.findMany({
        where: {
          huntId: hunt.id,
          status: "confirmed",
        },
        select: {
          userId: true,
        },
      });

      console.log(`   👥 Found ${confirmedParticipants.length} confirmed participants`);

      // Add all confirmed participants to chat
      for (const participant of confirmedParticipants) {
        const isOwner = participant.userId === hunt.userId;

        await prisma.chatMembership.create({
          data: {
            chatGroupId: chatGroup.id,
            userId: participant.userId,
            role: isOwner ? "owner" : "member",
          },
        });
      }

      // Update member count
      await prisma.chatGroup.update({
        where: { id: chatGroup.id },
        data: { memberCount: confirmedParticipants.length },
      });

      // Send welcome system message
      await prisma.chatMessage.create({
        data: {
          chatGroupId: chatGroup.id,
          userId: hunt.userId,
          content: `Welcome to ${hunt.name}! This is your hunt's group chat. Use this space to coordinate with fellow hunters, share updates, and plan your aurora adventure.`,
          messageType: "system",
        },
      });

      console.log(`   ✅ Added ${confirmedParticipants.length} members and sent welcome message`);
    } catch (error) {
      console.error(`   ❌ Error creating chat for hunt ${hunt.id}:`, error);
    }
  }

  console.log("\n🎉 Migration complete!");
}

createHuntChats()
  .then(() => {
    console.log("✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
