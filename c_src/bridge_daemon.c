#include "cdll.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static void output_json_response(const CircularPlaylist* list, const char* message) {
    printf("{\"status\":\"ok\",\"message\":\"%s\",\"count\":%d,", message ? message : "", list ? list->count : 0);

    /* Current node */
    if (list && list->current) {
        printf("\"current\":{\"id\":\"%s\",\"title\":\"%s\",\"artist\":\"%s\",\"type\":\"%s\",\"source\":\"%s\",\"address\":\"%p\",\"prev\":\"%s\",\"next\":\"%s\"},",
               list->current->id,
               list->current->title,
               list->current->artist,
               list->current->type == MEDIA_TYPE_VIDEO ? "video" : "audio",
               list->current->source,
               (void*)list->current,
               list->current->prev ? list->current->prev->id : "",
               list->current->next ? list->current->next->id : "");
    } else {
        printf("\"current\":null,");
    }

    /* Integrity validation */
    char err_buf[256] = "";
    int valid = playlist_validate_integrity(list, err_buf, sizeof(err_buf));
    printf("\"integrity\":{\"valid\":%s,\"error\":\"%s\"},", valid ? "true" : "false", err_buf);

    /* Ordered snapshot array */
    printf("\"items\":[");
    if (list && list->count > 0 && list->head) {
        MediaNode* curr = list->head;
        for (int i = 0; i < list->count; i++) {
            if (i > 0) printf(",");
            printf("{\"id\":\"%s\",\"title\":\"%s\",\"artist\":\"%s\",\"type\":\"%s\",\"source\":\"%s\",\"address\":\"%p\",\"prevId\":\"%s\",\"nextId\":\"%s\",\"isCurrent\":%s,\"isHead\":%s,\"isTail\":%s}",
                   curr->id,
                   curr->title,
                   curr->artist,
                   curr->type == MEDIA_TYPE_VIDEO ? "video" : "audio",
                   curr->source,
                   (void*)curr,
                   curr->prev ? curr->prev->id : "",
                   curr->next ? curr->next->id : "",
                   curr == list->current ? "true" : "false",
                   curr == list->head ? "true" : "false",
                   curr == list->head->prev ? "true" : "false");
            curr = curr->next;
        }
    }
    printf("]}\n");
    fflush(stdout);
}

int main(void) {
    CircularPlaylist* list = playlist_create();
    if (!list) return 1;

    /* Seed starter items */
    playlist_add(list, "c-track-1", "Bohemian Rhapsody", "Queen", MEDIA_TYPE_AUDIO, "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3");
    playlist_add(list, "c-track-2", "Ocean Coastline Waves", "Earth Visuals", MEDIA_TYPE_VIDEO, "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4");
    playlist_add(list, "c-track-3", "Hotel California", "Eagles", MEDIA_TYPE_AUDIO, "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3");
    playlist_add(list, "c-track-4", "Big Buck Bunny (Sample)", "Blender Studio", MEDIA_TYPE_VIDEO, "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4");
    playlist_add(list, "c-track-5", "Blinding Lights", "The Weeknd", MEDIA_TYPE_AUDIO, "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3");

    char line[1024];
    while (fgets(line, sizeof(line), stdin) != NULL) {
        // Strip newline
        size_t len = strlen(line);
        while (len > 0 && (line[len - 1] == '\n' || line[len - 1] == '\r')) {
            line[--len] = '\0';
        }

        if (len == 0) continue;

        if (strncmp(line, "NEXT", 4) == 0) {
            playlist_next(list);
            output_json_response(list, "next");
        } else if (strncmp(line, "PREV", 4) == 0) {
            playlist_previous(list);
            output_json_response(list, "previous");
        } else if (strncmp(line, "SELECT ", 7) == 0) {
            char* id = line + 7;
            playlist_select(list, id);
            output_json_response(list, "select");
        } else if (strncmp(line, "REMOVE ", 7) == 0) {
            char* id = line + 7;
            playlist_remove(list, id);
            output_json_response(list, "remove");
        } else if (strncmp(line, "CLEAR", 5) == 0) {
            playlist_clear(list);
            output_json_response(list, "clear");
        } else if (strncmp(line, "GET_ALL", 7) == 0) {
            output_json_response(list, "get_all");
        } else if (strncmp(line, "ADD ", 4) == 0) {
            /* Format: ADD id|title|artist|type|source */
            char* payload = line + 4;
            char* id = strtok(payload, "|");
            char* title = strtok(NULL, "|");
            char* artist = strtok(NULL, "|");
            char* type_str = strtok(NULL, "|");
            char* source = strtok(NULL, "|");

            if (id && title) {
                MediaType type = (type_str && strcmp(type_str, "video") == 0) ? MEDIA_TYPE_VIDEO : MEDIA_TYPE_AUDIO;
                playlist_add(list, id, title, artist ? artist : "", type, source ? source : "");
            }
            output_json_response(list, "add");
        } else if (strncmp(line, "INSERT_AFTER ", 13) == 0) {
            /* Format: INSERT_AFTER targetId|id|title|artist|type|source */
            char* payload = line + 13;
            char* targetId = strtok(payload, "|");
            char* id = strtok(NULL, "|");
            char* title = strtok(NULL, "|");
            char* artist = strtok(NULL, "|");
            char* type_str = strtok(NULL, "|");
            char* source = strtok(NULL, "|");

            if (targetId && id && title) {
                MediaType type = (type_str && strcmp(type_str, "video") == 0) ? MEDIA_TYPE_VIDEO : MEDIA_TYPE_AUDIO;
                playlist_insert_after(list, targetId, id, title, artist ? artist : "", type, source ? source : "");
            }
            output_json_response(list, "insert_after");
        } else if (strncmp(line, "EXIT", 4) == 0) {
            break;
        } else {
            output_json_response(list, "unknown_command");
        }
    }

    playlist_destroy(list);
    return 0;
}
