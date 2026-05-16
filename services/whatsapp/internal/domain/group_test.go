package domain

import "testing"

func TestGroup_ShouldProcessMessages(t *testing.T) {
	tests := []struct {
		name  string
		group *Group
		want  bool
	}{
		{
			name: "should process - monitored group",
			group: &Group{
				JID:         "123456789@g.us",
				Name:        "Test Group",
				IsMonitored: true,
			},
			want: true,
		},
		{
			name: "should not process - unmonitored group",
			group: &Group{
				JID:         "123456789@g.us",
				Name:        "Test Group",
				IsMonitored: false,
			},
			want: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.group.ShouldProcessMessages(); got != tt.want {
				t.Errorf("ShouldProcessMessages() = %v, want %v", got, tt.want)
			}
		})
	}
}
